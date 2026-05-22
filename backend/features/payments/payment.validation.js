const mongoose = require("mongoose");
const AppError = require("../../pkg/utils/AppError");

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateInit = (req, _res, next) => {
  const { orderId } = req.body || {};
  if (!orderId || !mongoose.isValidObjectId(orderId)) {
    return next(fail([{ field: "orderId", message: "valid orderId is required" }]));
  }
  next();
};

const validateVerify = (req, _res, next) => {
  const reference = req.body?.reference || req.query?.reference;
  if (!reference || typeof reference !== "string") {
    return next(fail([{ field: "reference", message: "reference is required" }]));
  }
  req.body.reference = reference;
  next();
};

module.exports = { validateInit, validateVerify };
