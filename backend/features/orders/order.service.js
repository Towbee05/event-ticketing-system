const Order = require("../../models/Order");
const OrderItem = require("../../models/OrderItem");
const Ticket = require("../../models/Tickets");
const Event = require("../../models/Event");
const IssuedTicket = require("../../models/IssuedTicket");
const AppError = require("../../pkg/utils/AppError");
const notifications = require("../notifications/notification.service");

const toNumber = (v) => {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "object" && typeof v.toString === "function") return parseFloat(v.toString());
  return parseFloat(v);
};

const USER_POPULATE = { path: "user", select: "name email" };
const EVENT_POPULATE = { path: "event", select: "title date venue status" };

const loadOrderWithItems = async (orderId) => {
  const order = await Order.findById(orderId).populate(USER_POPULATE).populate(EVENT_POPULATE);
  if (!order) return null;
  const items = await OrderItem.find({ order: order._id }).populate("ticket");
  return { ...order.toObject(), items };
};

const assertOwnerOrStaff = (order, user) => {
  if (user.role === "admin") return;
  if (String(order.user._id || order.user) !== String(user.id)) {
    throw new AppError("You do not have access to this order", 403, "FORBIDDEN");
  }
};

const listOrders = (filter = {}) =>
  Order.find(filter).populate(USER_POPULATE).populate(EVENT_POPULATE).sort({ createdAt: -1 });

const listOrdersForUser = (userId) =>
  Order.find({ user: userId }).populate(EVENT_POPULATE).sort({ createdAt: -1 });

const getOrder = async (orderId, user) => {
  const order = await loadOrderWithItems(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  assertOwnerOrStaff(order, user);
  return order;
};

const releaseSeats = (items) =>
  Promise.all(
    items.map((it) =>
      Ticket.updateOne({ _id: it.ticket }, { $inc: { sold: -it.quantity } }).catch(() => null),
    ),
  );

const createOrder = async ({ userId, eventId, items }) => {
  const event = await Event.findById(eventId);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  if (event.status !== "published") {
    throw new AppError(
      "Cannot order tickets for an event that is not published",
      400,
      "EVENT_NOT_PUBLISHED",
    );
  }

  // Track reservations so we can roll back any partial increments on failure.
  const reserved = [];
  const now = new Date();
  let totalAmount = 0;
  const itemDocs = [];

  try {
    for (const line of items) {
      const qty = Number(line.quantity);
      // Conditional increment: only succeeds if seats remain, sales window is open,
      // and the ticket actually belongs to the requested event.
      const ticket = await Ticket.findOneAndUpdate(
        {
          _id: line.ticket,
          event: eventId,
          salesStartDate: { $lte: now },
          salesEndDate: { $gte: now },
          $expr: { $lte: [{ $add: ["$sold", qty] }, "$quantity"] },
        },
        { $inc: { sold: qty } },
        { new: true },
      );

      if (!ticket) {
        throw new AppError(
          `Ticket ${line.ticket} is unavailable (sold out, sales closed, or does not belong to this event)`,
          409,
          "TICKET_UNAVAILABLE",
        );
      }

      reserved.push({ ticket: ticket._id, quantity: qty });

      const unitPrice = toNumber(ticket.price);
      const subTotal = unitPrice * qty;
      totalAmount += subTotal;
      itemDocs.push({ ticket: ticket._id, quantity: qty, unitPrice: ticket.price, subTotal });
    }

    const order = await Order.create({
      user: userId,
      event: eventId,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "pending",
    });

    const createdItems = await OrderItem.insertMany(
      itemDocs.map((doc) => ({ ...doc, order: order._id })),
    );

    // Fire-and-forget notification — we never want emailing to fail the order.
    notifications
      .dispatch({
        userId,
        title: `Order received: ${event.title}`,
        message: `We're holding your tickets. Complete payment to confirm your booking (order #${String(order._id).slice(-6)}).`,
      })
      .catch((e) => console.error("[orders] notification failed:", e.message));

    return { ...order.toObject(), items: createdItems };
  } catch (err) {
    await releaseSeats(reserved);
    throw err;
  }
};

const cancelOrder = async (orderId, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  assertOwnerOrStaff(order, user);

  if (order.orderStatus === "cancelled") return order;
  if (order.orderStatus === "completed") {
    throw new AppError(
      "Completed orders cannot be cancelled here — request a refund",
      409,
      "ORDER_COMPLETED",
    );
  }

  const items = await OrderItem.find({ order: order._id });
  await releaseSeats(items);

  order.orderStatus = "cancelled";
  if (order.paymentStatus === "pending") order.paymentStatus = "failed";
  await order.save();

  notifications
    .dispatch({
      userId: order.user,
      title: "Order cancelled",
      message: `Order #${String(order._id).slice(-6)} was cancelled and seats released.`,
    })
    .catch((e) => console.error("[orders] notification failed:", e.message));

  return order;
};

// Marks an order paid/completed — invoked by the payments feature after successful verification.
const completeOrder = async (orderId) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { orderStatus: "completed", paymentStatus: "paid" },
    { new: true, runValidators: true },
  );
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  return order;
};

const deleteOrder = async (orderId, user) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  if (user.role !== "admin") {
    throw new AppError("Only admins may delete orders", 403, "FORBIDDEN");
  }

  // Release seats only if the order hasn't already been cancelled/refunded.
  if (order.orderStatus !== "cancelled") {
    const items = await OrderItem.find({ order: order._id });
    await releaseSeats(items);
  }

  // Cascade: kill the issued tickets so their QR codes can never scan again.
  await IssuedTicket.deleteMany({ order: order._id });
  await OrderItem.deleteMany({ order: order._id });
  await order.deleteOne();
};

// Public helper for the payments feature: when a payment fails, release any seats
// the order was holding and mark the order cancelled. Idempotent — calling on an
// already-cancelled order is a no-op.
const releaseSeatsForOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) return null;
  if (order.orderStatus === "cancelled") return order;

  const items = await OrderItem.find({ order: order._id });
  await releaseSeats(items);

  order.orderStatus = "cancelled";
  if (order.paymentStatus === "pending") order.paymentStatus = "failed";
  await order.save();
  return order;
};

module.exports = {
  listOrders,
  listOrdersForUser,
  getOrder,
  createOrder,
  cancelOrder,
  completeOrder,
  deleteOrder,
  releaseSeatsForOrder,
};
