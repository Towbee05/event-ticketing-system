import axios from "axios";
import Payment from "./payment.model.js";
// import Order from "../order/order.model.js"; 
// // order has not been created yet, so we will comment this out for now

// initialize payment service for a given order and user
export const initializePaymentService = async (orderId, user) => {
  //  find the order by id and ensure it belongs to the user
  const order = await Order.findOne({ _id: orderId, user: user._id });

  if (!order) {
    throw new Error("Order not found or does not belong to the user");
  }

  //   prevent duplicate payment initialization for the same order
  if (order.paymentStatus === "successful") {
    throw new Error("Payment has already been completed for this order");
  }

  //   initialize paystack payment
  const response = await axios.post(
    `${process.env.PAYSTACK_BASE_URL}/transaction/initialize`,
    {
      email: user.email,
      amount: order.totalAmount * 100, // convert to kobo
      reference: `order_${order._id}_${Date.now()}`,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    },
  );

  const { data } = response.data.data;

  //   save payment details
  const payment = await Payment.create({
    order: order._id,
    user: user._id,
    amount: order.totalAmount,
    reference: data.reference,
    status: "pending",
  });

  return {
    paymentUrl: data.authorization_url,
    reference: data.reference,
  };
};

// verify payment after user completes the transaction
export const verifyPaymentService = async (reference) => {
  //   find payment
  const payment = await Payment.findOne({ reference });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // prevent duplicate verification
  if (payment.status === "successful") {
    return payment;
  }

  //   verify payment with paystack
  const response = await axios.get(
    `${process.env.PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    },
  );

  const { data } = response.data.data;

  //   if payment is successful, update payment and order status
  if (data.status === "success") {
    payment.status = "successful";
    payment.paidAt = new Date();

    await payment.save();

    // update order payment status
    const order = await Order.findById(payment.order);

    if (order) {
      order.paymentStatus = "successful";
      order.isPaid = true;

      await order.save();
    }
  }

  return payment;
};
