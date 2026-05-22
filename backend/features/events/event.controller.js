const catchAsync = require("../../pkg/utils/catchAsync");
const { success } = require("../../pkg/utils/response");
const eventService = require("./event.service");

const list = catchAsync(async (req, res) => {
  const data = await eventService.list({
    user: req.user,
    mine: req.query.mine === "true",
  });
  success(res, { data });
});

const getOne = catchAsync(async (req, res) => {
  const data = await eventService.get(req.params.id);
  success(res, { data });
});

const create = catchAsync(async (req, res) => {
  const data = await eventService.create(req.body, req.user);
  success(res, { statusCode: 201, message: "Event created", data });
});

const update = catchAsync(async (req, res) => {
  const data = await eventService.update(req.params.id, req.body, req.user);
  success(res, { message: "Event updated", data });
});

const remove = catchAsync(async (req, res) => {
  await eventService.remove(req.params.id, req.user);
  success(res, { message: "Event deleted" });
});

const publish = catchAsync(async (req, res) => {
  const data = await eventService.setStatus(req.params.id, "published", req.user);
  success(res, { message: "Event published", data });
});

const cancel = catchAsync(async (req, res) => {
  const data = await eventService.setStatus(req.params.id, "cancelled", req.user);
  success(res, { message: "Event cancelled", data });
});

module.exports = { list, getOne, create, update, remove, publish, cancel };
