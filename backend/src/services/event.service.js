const Event = require("../models/Event");
const Ticket = require("../models/Tickets");
const IssuedTicket = require("../models/IssuedTicket");
const AppError = require("../utils/AppError");

const ORGANIZER_POPULATE = { path: "organizer", select: "name email" };

// Whitelist of mutable fields. organizer is set from the JWT, never the body.
const pickFields = (body = {}) => ({
  title: body.title,
  description: body.description,
  date: body.date,
  venue: body.venue,
  category: body.category,
  bannerImage: body.bannerImage,
  status: body.status,
});

const stripUndefined = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v;
  return out;
};

const assertCanManage = (event, user) => {
  if (user.role === "admin") return;
  if (String(event.organizer) !== String(user.id)) {
    throw new AppError("You can only manage events you organize", 403, "FORBIDDEN");
  }
};

// Filter is role-aware: anon → published only, organizer → published + own,
// admin → all. ?mine=true overrides to "only mine".
const buildListFilter = ({ user, mine }) => {
  if (mine && user) return { organizer: user.id };
  if (!user) return { status: "published" };
  if (user.role === "admin") return {};
  if (user.role === "organizer") {
    return { $or: [{ status: "published" }, { organizer: user.id }] };
  }
  return { status: "published" };
};

const list = ({ user, mine } = {}) =>
  Event.find(buildListFilter({ user, mine })).populate(ORGANIZER_POPULATE).sort({ date: 1 });

const get = async (id) => {
  const event = await Event.findById(id).populate(ORGANIZER_POPULATE);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  return event;
};

const create = (body, user) =>
  Event.create({ ...stripUndefined(pickFields(body)), organizer: user.id });

const update = async (id, body, user) => {
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  assertCanManage(event, user);
  Object.assign(event, stripUndefined(pickFields(body)));
  await event.save();
  return event;
};

const remove = async (id, user) => {
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  assertCanManage(event, user);

  // Refuse delete if any actual attendees exist — they have QR codes referencing
  // this event. The organizer should cancel the event instead.
  const hasIssued = await IssuedTicket.exists({ event: event._id });
  if (hasIssued) {
    throw new AppError(
      "Cannot delete an event with issued tickets. Cancel the event instead.",
      409,
      "EVENT_HAS_TICKETS",
    );
  }

  // Safe to cascade — no real attendees. Clean up the ticket types we created.
  await Ticket.deleteMany({ event: event._id });
  await event.deleteOne();
};

const setStatus = async (id, status, user) => {
  const event = await Event.findById(id);
  if (!event) throw new AppError("Event not found", 404, "EVENT_NOT_FOUND");
  assertCanManage(event, user);
  event.status = status;
  await event.save();
  return event;
};

module.exports = { list, get, create, update, remove, setStatus };
