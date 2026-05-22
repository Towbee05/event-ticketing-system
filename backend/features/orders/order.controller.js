const catchAsync = require("../../pkg/utils/catchAsync");
const { success } = require("../../pkg/utils/response");
const orderService = require("./order.service");

// Admin-only listing with optional filters.
const list = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.user) filter.user = req.query.user;
  if (req.query.event) filter.event = req.query.event;
  if (req.query.status) filter.orderStatus = req.query.status;
  const data = await orderService.listOrders(filter);
  success(res, { data });
});

// PRD: GET /api/orders/my-orders
const myOrders = catchAsync(async (req, res) => {
  const data = await orderService.listOrdersForUser(req.user.id);
  success(res, { data });
});

const getOne = catchAsync(async (req, res) => {
  const data = await orderService.getOrder(req.params.id, req.user);
  success(res, { data });
});

const create = catchAsync(async (req, res) => {
  const data = await orderService.createOrder({
    userId: req.user.id,
    eventId: req.body.event,
    items: req.body.items,
  });
  success(res, { statusCode: 201, message: "Order created successfully", data });
});

const cancel = catchAsync(async (req, res) => {
  const data = await orderService.cancelOrder(req.params.id, req.user);
  success(res, { message: "Order cancelled", data });
});

const complete = catchAsync(async (req, res) => {
  const data = await orderService.completeOrder(req.params.id);
  success(res, { message: "Order marked completed", data });
});

const remove = catchAsync(async (req, res) => {
  await orderService.deleteOrder(req.params.id, req.user);
  success(res, { message: "Order deleted successfully" });
});

module.exports = { list, myOrders, getOne, create, cancel, complete, remove };
