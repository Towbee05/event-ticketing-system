const AppError = require("../utils/AppError");

const EMAIL = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

const fail = (errors) => {
  const err = new AppError("Validation failed", 422, "VALIDATION_ERROR");
  err.errors = errors;
  return err;
};

const validateRegister = (req, _res, next) => {
  const { name, email, password, role } = req.body || {};
  const errors = [];
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({ field: "name", message: "name must be at least 2 characters" });
  }
  if (!email || !EMAIL.test(email)) {
    errors.push({ field: "email", message: "valid email is required" });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    errors.push({ field: "password", message: "password must be at least 8 characters" });
  }
  if (role && !["attendee", "organizer"].includes(role)) {
    // admin can only be assigned by an existing admin via the users feature, not at signup
    errors.push({ field: "role", message: "role must be attendee or organizer" });
  }
  if (errors.length) return next(fail(errors));
  next();
};

const validateLogin = (req, _res, next) => {
  const { email, password } = req.body || {};
  const errors = [];
  if (!email || !EMAIL.test(email)) errors.push({ field: "email", message: "valid email is required" });
  if (!password) errors.push({ field: "password", message: "password is required" });
  if (errors.length) return next(fail(errors));
  next();
};

const validateForgot = (req, _res, next) => {
  const { email } = req.body || {};
  if (!email || !EMAIL.test(email)) {
    return next(fail([{ field: "email", message: "valid email is required" }]));
  }
  next();
};

const validateReset = (req, _res, next) => {
  const { token, password } = req.body || {};
  const errors = [];
  if (!token || typeof token !== "string") errors.push({ field: "token", message: "token is required" });
  if (!password || password.length < 8) errors.push({ field: "password", message: "password must be at least 8 characters" });
  if (errors.length) return next(fail(errors));
  next();
};

const validateChangePassword = (req, _res, next) => {
  const { currentPassword, newPassword } = req.body || {};
  const errors = [];
  if (!currentPassword) errors.push({ field: "currentPassword", message: "currentPassword is required" });
  if (!newPassword || newPassword.length < 8) errors.push({ field: "newPassword", message: "newPassword must be at least 8 characters" });
  if (currentPassword && currentPassword === newPassword) {
    errors.push({ field: "newPassword", message: "new password must differ from current password" });
  }
  if (errors.length) return next(fail(errors));
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateForgot,
  validateReset,
  validateChangePassword,
};
