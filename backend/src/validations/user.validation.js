const mongoose = require("mongoose");
const AppError = require("../utils/AppError");

const EMAIL = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const ROLES = ["attendee", "organizer", "admin"];

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateUpdateMe = (req, _res, next) => {
  const { name, email, profileImage } = req.body || {};
  const errors = [];
  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    errors.push({ field: "name", message: "name must be at least 2 characters" });
  }
  if (email !== undefined && !EMAIL.test(email)) {
    errors.push({ field: "email", message: "valid email is required" });
  }
  if (profileImage !== undefined && typeof profileImage !== "string") {
    errors.push({ field: "profileImage", message: "profileImage must be a string URL" });
  }
  // Reject any sensitive fields snuck in.
  for (const blocked of ["password", "role", "passwordResetTokenHash", "passwordResetExpiresAt", "_id"]) {
    if (blocked in (req.body || {})) {
      errors.push({ field: blocked, message: `${blocked} cannot be updated here` });
    }
  }
  if (errors.length) return next(fail(errors));
  next();
};

const validateUpdateRole = (req, _res, next) => {
  const { role } = req.body || {};
  if (!ROLES.includes(role)) {
    return next(fail([{ field: "role", message: `role must be one of ${ROLES.join(", ")}` }]));
  }
  next();
};

const validateIdParam = (paramName) => (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params[paramName])) {
    return next(new AppError(`Invalid ${paramName}`, 400, "INVALID_ID"));
  }
  next();
};

module.exports = { validateUpdateMe, validateUpdateRole, validateIdParam };
