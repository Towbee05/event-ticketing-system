const mongoose = require("mongoose");
const AppError = require("../../pkg/utils/AppError");

const isObjectId = (v) => mongoose.isValidObjectId(v);

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateCreate = (req, _res, next) => {
  const { event, items } = req.body || {};
  const errors = [];

  if (!event || !isObjectId(event)) {
    errors.push({ field: "event", message: "valid event id is required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    errors.push({ field: "items", message: "items must be a non-empty array" });
  } else {
    items.forEach((line, i) => {
      if (!line || !isObjectId(line.ticket)) {
        errors.push({ field: `items[${i}].ticket`, message: "valid ticket id is required" });
      }
      const qty = Number(line && line.quantity);
      if (!Number.isInteger(qty) || qty < 1) {
        errors.push({
          field: `items[${i}].quantity`,
          message: "quantity must be a positive integer",
        });
      }
    });
  }

  if (errors.length) return next(fail(errors));
  next();
};

const validateIdParam = (paramName) => (req, _res, next) => {
  if (!isObjectId(req.params[paramName])) {
    return next(new AppError(`Invalid ${paramName}`, 400, "INVALID_ID"));
  }
  next();
};

module.exports = { validateCreate, validateIdParam };
