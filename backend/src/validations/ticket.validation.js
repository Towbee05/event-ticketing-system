const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const TICKET_TYPES = ["early-bird", "regular", "vip-ticket"];

const isObjectId = (v) => mongoose.isValidObjectId(v);

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateCreate = (req, _res, next) => {
  const { event, ticketType, price, quantity, salesEndDate } = req.body || {};
  const errors = [];

  if (!event || !isObjectId(event)) errors.push({ field: "event", message: "valid event id is required" });
  if (ticketType && !TICKET_TYPES.includes(ticketType)) {
    errors.push({ field: "ticketType", message: `must be one of ${TICKET_TYPES.join(", ")}` });
  }
  if (price === undefined || Number(price) < 0 || Number.isNaN(Number(price))) {
    errors.push({ field: "price", message: "price must be a non-negative number" });
  }
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) {
    errors.push({ field: "quantity", message: "quantity must be a positive integer" });
  }
  if (!salesEndDate || Number.isNaN(Date.parse(salesEndDate))) {
    errors.push({ field: "salesEndDate", message: "valid salesEndDate is required" });
  }

  if (errors.length) return next(fail(errors));
  next();
};

const validateUpdate = (req, _res, next) => {
  const errors = [];
  const { ticketType, price, quantity, salesEndDate, salesStartDate } = req.body || {};

  if (ticketType !== undefined && !TICKET_TYPES.includes(ticketType)) {
    errors.push({ field: "ticketType", message: `must be one of ${TICKET_TYPES.join(", ")}` });
  }
  if (price !== undefined && (Number(price) < 0 || Number.isNaN(Number(price)))) {
    errors.push({ field: "price", message: "price must be a non-negative number" });
  }
  if (quantity !== undefined && (!Number.isInteger(Number(quantity)) || Number(quantity) < 1)) {
    errors.push({ field: "quantity", message: "quantity must be a positive integer" });
  }
  if (salesEndDate !== undefined && Number.isNaN(Date.parse(salesEndDate))) {
    errors.push({ field: "salesEndDate", message: "must be a valid date" });
  }
  if (salesStartDate !== undefined && Number.isNaN(Date.parse(salesStartDate))) {
    errors.push({ field: "salesStartDate", message: "must be a valid date" });
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

module.exports = { validateCreate, validateUpdate, validateIdParam };
