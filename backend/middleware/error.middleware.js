const AppError = require("../pkg/utils/AppError");

const notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "ROUTE_NOT_FOUND"));
};

const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let code = err.code;
  // Custom AppError instances may attach an errors array (e.g. validation middleware).
  let errors = Array.isArray(err.errors) ? err.errors : undefined;

  // Mongoose: bad ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    code = code || "INVALID_ID";
  }

  // Mongoose: validation errors (object shape, not array)
  if (err.name === "ValidationError" && err.errors && !Array.isArray(err.errors)) {
    statusCode = 422;
    code = code || "VALIDATION_ERROR";
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = "Validation failed";
  }

  // Mongoose: duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_KEY";
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate value";
  }

  // Dev-only request log on failures — saves having to add a full request logger right now.
  if (process.env.NODE_ENV !== "production" && statusCode >= 400) {
    const label = `[${statusCode}] ${req.method} ${req.originalUrl}`;
    if (errors) {
      console.log(label, code, "→", errors.map((e) => `${e.field}: ${e.message}`).join(" | "));
    } else {
      console.log(label, code || "", message);
    }
  }

  if (statusCode >= 500) {
    // Surface unexpected errors so the team can debug; structured logger arrives later (Winston).
    console.error("[error]", err);
  }

  const body = { success: false, message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
