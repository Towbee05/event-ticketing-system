const mongoose = require("mongoose");
const AppError = require("../../pkg/utils/AppError");

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateUpsert = (req, _res, next) => {
  const { name, description } = req.body || {};
  const errors = [];
  if (!name || typeof name !== "string" || !name.trim()) {
    errors.push({ field: "name", message: "name is required" });
  }
  if (description !== undefined && typeof description !== "string") {
    errors.push({ field: "description", message: "description must be a string" });
  }
  if (errors.length) return next(fail(errors));
  next();
};

const validateIdParam = (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid category id", 400, "INVALID_ID"));
  }
  next();
};

module.exports = { validateUpsert, validateIdParam };
