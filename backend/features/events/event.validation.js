const mongoose = require("mongoose");
const AppError = require("../../pkg/utils/AppError");

const STATUSES = ["draft", "published", "cancelled"];

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const isNonEmptyString = (v) =>
  typeof v === "string" && v.trim().length > 0;

// Used for both create (required=true) and update (required=false).
const validateBody = (required = false) => (req, _res, next) => {
  const body = req.body || {};
  const errors = [];

  if (required || body.title !== undefined) {
    if (!isNonEmptyString(body.title)) errors.push({ field: "title", message: "title is required" });
  }
  if (required || body.description !== undefined) {
    if (!isNonEmptyString(body.description)) {
      errors.push({ field: "description", message: "description is required" });
    }
  }
  if (required || body.venue !== undefined) {
    if (!isNonEmptyString(body.venue)) errors.push({ field: "venue", message: "venue is required" });
  }
  if (required || body.date !== undefined) {
    if (!body.date || Number.isNaN(Date.parse(body.date))) {
      errors.push({ field: "date", message: "date must be a valid ISO date" });
    }
  }
  if (body.status !== undefined && !STATUSES.includes(body.status)) {
    errors.push({ field: "status", message: `status must be one of ${STATUSES.join(", ")}` });
  }
  // Block client from setting fields it shouldn't.
  for (const blocked of ["organizer", "_id", "createdAt", "updatedAt"]) {
    if (blocked in body) {
      errors.push({ field: blocked, message: `${blocked} cannot be set by clients` });
    }
  }

  if (errors.length) return next(fail(errors));
  next();
};

const validateIdParam = (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid event id", 400, "INVALID_ID"));
  }
  next();
};

module.exports = { validateBody, validateIdParam };
