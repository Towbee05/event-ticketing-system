const catchAsync = require("../utils/catchAsync");
const { success } = require("../utils/response");
const paymentService = require("../services/payment.service");

const initialize = catchAsync(async (req, res) => {
  const data = await paymentService.initialize({
    orderId: req.body.orderId,
    user: req.user,
  });
  success(res, { statusCode: 201, message: "Payment initialised", data });
});

const verify = catchAsync(async (req, res) => {
  const result = await paymentService.verify({
    reference: req.body.reference,
    user: req.user,
  });
  success(res, {
    message: result.succeeded === false ? "Payment failed" : "Payment verified",
    data: {
      reference: result.payment.paymentReference,
      status: result.payment.status,
      order: result.order,
      alreadyVerified: result.alreadyVerified,
    },
  });
});

const listForOrder = catchAsync(async (req, res) => {
  const data = await paymentService.listForOrder(req.params.orderId, req.user);
  success(res, { data });
});

module.exports = { initialize, verify, listForOrder };
