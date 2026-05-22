const crypto = require("crypto");
const Order = require("../../models/Order");
const Payment = require("../../models/Payment");
const User = require("../../models/User");
const AppError = require("../../pkg/utils/AppError");
const paystack = require("../../pkg/utils/paystack");
const notifications = require("../notifications/notification.service");
const issuance = require("../tickets/issuance.service");
const orderService = require("../orders/order.service");

// Pulls a number out of a Mongo Decimal128 or a string.
const toNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  return parseFloat(String(v));
};

const newReference = () => `etb_${crypto.randomBytes(8).toString("hex")}_${Date.now()}`;
const devReference = () => `DEV_${crypto.randomBytes(6).toString("hex")}_${Date.now()}`;

const callbackUrl = () => {
  const base = process.env.FRONTEND_URL || "http://localhost:5174";
  return `${base.replace(/\/$/, "")}/payment/callback`;
};

const assertOrderForUser = (order, user) => {
  if (user.role === "admin") return;
  if (String(order.user) !== String(user.id)) {
    throw new AppError("You do not have access to this order", 403, "FORBIDDEN");
  }
};

const initialize = async ({ orderId, user }) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  assertOrderForUser(order, user);

  if (order.paymentStatus === "paid") {
    throw new AppError("Order is already paid", 409, "ORDER_ALREADY_PAID");
  }
  if (order.orderStatus === "cancelled") {
    throw new AppError("Cannot pay for a cancelled order", 409, "ORDER_CANCELLED");
  }

  const amount = toNumber(order.totalAmount);
  if (amount <= 0) throw new AppError("Order has no amount due", 400, "INVALID_AMOUNT");

  // Look up the user's email — Paystack requires it; we'll also reuse for receipts.
  const userDoc = await User.findById(order.user).select("email");
  if (!userDoc) throw new AppError("Order user not found", 404, "USER_NOT_FOUND");

  // Dev mode: no Paystack key, return a fake URL that lands back on the frontend.
  // Real mode: call Paystack /transaction/initialize.
  let authorizationUrl;
  let reference;
  let provider;

  if (!paystack.isEnabled()) {
    reference = devReference();
    authorizationUrl = `${callbackUrl()}?reference=${encodeURIComponent(reference)}&dev=1`;
    provider = "dev-mock";
  } else {
    reference = newReference();
    const data = await paystack.initializeTransaction({
      email: userDoc.email,
      amountKobo: Math.round(amount * 100), // Paystack uses kobo (smallest currency unit)
      reference,
      callbackUrl: callbackUrl(),
      metadata: { orderId: String(order._id), userId: String(order.user) },
    });
    authorizationUrl = data.authorization_url;
    provider = "paystack";
  }

  await Payment.create({
    order: order._id,
    paymentReference: reference,
    provider,
    amount,
    status: "pending",
  });

  return { authorizationUrl, reference, provider };
};

const verify = async ({ reference, user }) => {
  const payment = await Payment.findOne({ paymentReference: reference });
  if (!payment) throw new AppError("Payment not found", 404, "PAYMENT_NOT_FOUND");

  let order = await Order.findById(payment.order);
  if (!order) throw new AppError("Order for this payment is missing", 404, "ORDER_NOT_FOUND");
  if (user) assertOrderForUser(order, user);

  // Idempotent: if we've already recorded a terminal state, just return current state.
  if (payment.status === "successful" && order.paymentStatus === "paid") {
    return { payment, order, alreadyVerified: true, succeeded: true };
  }
  if (payment.status === "failed") {
    return { payment, order, alreadyVerified: true, succeeded: false };
  }

  let succeeded;
  let providerData;

  if (payment.provider === "dev-mock" || !paystack.isEnabled()) {
    // Dev-mock: success unless the caller forced a failure via reference suffix.
    succeeded = !reference.endsWith("_fail");
    providerData = { mocked: true };
  } else {
    const data = await paystack.verifyTransaction(reference);
    succeeded = data.status === "success";
    providerData = data;
  }

  payment.status = succeeded ? "successful" : "failed";
  payment.paidAt = succeeded ? new Date() : null;
  payment.providerData = providerData;
  await payment.save();

  if (succeeded) {
    order.paymentStatus = "paid";
    order.orderStatus = "completed";
    await order.save();
    // Issue the actual ticket codes once payment lands. Idempotent — safe on re-verify.
    try {
      await issuance.issueForOrder(order._id);
    } catch (e) {
      console.error("[payments] ticket issuance failed:", e.message);
    }
  } else {
    // On failure, release the held seats so they can be resold, and cancel the
    // order. Without this the seats would stay locked indefinitely.
    try {
      const updated = await orderService.releaseSeatsForOrder(order._id);
      if (updated) order = updated;
    } catch (e) {
      console.error("[payments] seat release on failure failed:", e.message);
    }
  }

  notifications
    .dispatch({
      userId: order.user,
      title: succeeded ? "Payment confirmed 🎉" : "Payment failed",
      message: succeeded
        ? `Payment of ${toNumber(order.totalAmount)} confirmed for order #${String(order._id).slice(-6)}. Your tickets are locked in.`
        : `Payment for order #${String(order._id).slice(-6)} did not go through. Try again from My Orders.`,
    })
    .catch((e) => console.error("[payments] notification failed:", e.message));

  return { payment, order, alreadyVerified: false, succeeded };
};

const listForOrder = async (orderId, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  assertOrderForUser(order, user);
  return Payment.find({ order: order._id }).sort({ createdAt: -1 });
};

module.exports = { initialize, verify, listForOrder };
