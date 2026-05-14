import asyncHandler from "../../shared/asynHandler.js";
import {
  initializePaymentService,
  verifyPaymentService,
} from "./payment.service.js";

import {
  initializePaymentSchema,
  verifyPaymentSchema,
} from "./payment.validation.js";

// Initialize Payment
export const initializePayment = asyncHandler(async (req, res) => {
  const { error } = initializePaymentSchema.validate(req.body);

  if (error) {
    const err = new Error(error.details[0].message);

    err.statusCode = 400;

    throw err;
  }

  const { orderId } = req.body;

  const payment = await initializePaymentService(orderId, req.user);

  res.status(200).json({
    success: true,
    message: "Payment initialized successfully",
    data: payment,
  });
});

// Verify Payment
export const verifyPayment = asyncHandler(async (req, res) => {
  const { error } = verifyPaymentSchema.validate(req.body);

  if (error) {
    const err = new Error(error.details[0].message);

    err.statusCode = 400;

    throw err;
  }

  const { reference } = req.body;

  const payment = await verifyPaymentService(reference);

  res.status(200).json({
    success: true,
    message: "Payment verified successfully",
    data: payment,
  });
});
