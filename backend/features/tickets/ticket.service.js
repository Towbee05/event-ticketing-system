const Ticket = require("../../models/Tickets");
const Event = require("../../models/Event");
const AppError = require("../../pkg/utils/AppError");

const EVENT_POPULATE = { path: "event", select: "title date venue status organizer" };

const listTickets = ({ event } = {}) => {
  const filter = {};
  if (event) filter.event = event;
  return Ticket.find(filter).populate(EVENT_POPULATE);
};

const listTicketsForEvent = (eventId) =>
  Ticket.find({ event: eventId }).populate(EVENT_POPULATE);

const getTicket = async (id) => {
  const ticket = await Ticket.findById(id).populate(EVENT_POPULATE);
  if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  return ticket;
};

// Organizers can only manage tickets for their own events; admins can manage any.
const assertCanManageEvent = (event, user) => {
  if (user.role === "admin") return;
  if (String(event.organizer) !== String(user.id)) {
    throw new AppError(
      "You can only manage tickets for events you organize",
      403,
      "FORBIDDEN",
    );
  }
};

const createTicket = async (payload, user) => {
  const event = await Event.findById(payload.event);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  assertCanManageEvent(event, user);
  return Ticket.create(payload);
};

const updateTicket = async (id, payload, user) => {
  const ticket = await Ticket.findById(id).populate({ path: "event", select: "organizer" });
  if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  if (ticket.event) assertCanManageEvent(ticket.event, user);

  // `sold` is only mutated by the order flow.
  const { sold, event: _ignoreEvent, ...updates } = payload;

  Object.assign(ticket, updates);
  await ticket.save();
  return ticket;
};

const deleteTicket = async (id, user) => {
  const ticket = await Ticket.findById(id).populate({ path: "event", select: "organizer" });
  if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  if (ticket.event) assertCanManageEvent(ticket.event, user);
  if (ticket.sold > 0) {
    throw new AppError(
      "Cannot delete a ticket that already has sales",
      409,
      "TICKET_HAS_SALES",
    );
  }
  await ticket.deleteOne();
};

const getAvailability = async (id) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
  const now = new Date();
  const available = Math.max(0, ticket.quantity - ticket.sold);
  const onSale =
    now >= ticket.salesStartDate && now <= ticket.salesEndDate && available > 0;
  return {
    ticket: ticket._id,
    available,
    sold: ticket.sold,
    quantity: ticket.quantity,
    onSale,
  };
};

module.exports = {
  listTickets,
  listTicketsForEvent,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getAvailability,
};
