const catchAsync = require("../../pkg/utils/catchAsync");
const { success } = require("../../pkg/utils/response");
const ticketService = require("./ticket.service");

const list = catchAsync(async (req, res) => {
  const data = await ticketService.listTickets({ event: req.query.event, user: req.user });
  success(res, { data });
});

const listForEvent = catchAsync(async (req, res) => {
  const data = await ticketService.listTicketsForEvent(req.params.eventId, req.user);
  success(res, { data });
});

const getOne = catchAsync(async (req, res) => {
  const data = await ticketService.getTicket(req.params.id, req.user);
  success(res, { data });
});

const create = catchAsync(async (req, res) => {
  const data = await ticketService.createTicket(req.body, req.user);
  success(res, { statusCode: 201, message: "Ticket created successfully", data });
});

const update = catchAsync(async (req, res) => {
  const data = await ticketService.updateTicket(req.params.id, req.body, req.user);
  success(res, { message: "Ticket updated successfully", data });
});

const remove = catchAsync(async (req, res) => {
  await ticketService.deleteTicket(req.params.id, req.user);
  success(res, { message: "Ticket deleted successfully" });
});

const availability = catchAsync(async (req, res) => {
  const data = await ticketService.getAvailability(req.params.id, req.user);
  success(res, { data });
});

module.exports = { list, listForEvent, getOne, create, update, remove, availability };
