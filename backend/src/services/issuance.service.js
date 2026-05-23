const IssuedTicket = require("../models/IssuedTicket");
const OrderItem = require("../models/OrderItem");
const Order = require("../models/Order");
const AppError = require("../utils/AppError");

// Idempotent: if tickets are already issued for this order, returns the existing rows.
async function issueForOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  const existing = await IssuedTicket.find({ order: order._id });
  if (existing.length > 0) return existing;

  const items = await OrderItem.find({ order: order._id });

  const docs = [];
  for (const item of items) {
    for (let i = 0; i < item.quantity; i += 1) {
      docs.push({
        order: order._id,
        orderItem: item._id,
        event: order.event,
        holder: order.user,
        ticketType: item.ticket,
        code: IssuedTicket.generateCode(),
        status: "valid",
      });
    }
  }
  if (docs.length === 0) return [];

  // Tiny collision risk on the random code — retry the insert by regenerating the
  // colliding codes if needed. 48-bit space, so this almost never fires.
  try {
    return await IssuedTicket.insertMany(docs, { ordered: true });
  } catch (err) {
    if (err.code === 11000) {
      for (const d of docs) d.code = IssuedTicket.generateCode();
      return IssuedTicket.insertMany(docs, { ordered: true });
    }
    throw err;
  }
}

const listForUser = (userId) =>
  IssuedTicket.find({ holder: userId, status: { $ne: "cancelled" } })
    .populate({ path: "event", select: "title date venue status bannerImage" })
    .populate({ path: "ticketType", select: "ticketType price" })
    .sort({ createdAt: -1 });

const lookupByCode = async (code) => {
  const ticket = await IssuedTicket.findOne({ code: code.toUpperCase() })
    .populate({ path: "event", select: "title date venue organizer" })
    .populate({ path: "holder", select: "name email" })
    .populate({ path: "ticketType", select: "ticketType price" });
  if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  return ticket;
};

// Marks a ticket used. Only the event's organizer (or an admin) may scan.
const validate = async (code, user) => {
  const ticket = await lookupByCode(code);

  const eventOrganizer = ticket.event?.organizer
    ? String(ticket.event.organizer)
    : null;
  if (user.role !== "admin" && eventOrganizer !== String(user.id)) {
    throw new AppError(
      "You can only validate tickets for events you organize",
      403,
      "FORBIDDEN",
    );
  }

  if (ticket.status === "cancelled") {
    throw new AppError("Ticket has been cancelled", 409, "TICKET_CANCELLED");
  }
  if (ticket.status === "used") {
    throw new AppError(
      `Ticket was already used at ${ticket.usedAt?.toISOString()}`,
      409,
      "TICKET_ALREADY_USED",
    );
  }

  ticket.status = "used";
  ticket.usedAt = new Date();
  ticket.usedBy = user.id;
  await ticket.save();
  return ticket;
};

module.exports = { issueForOrder, listForUser, lookupByCode, validate };
