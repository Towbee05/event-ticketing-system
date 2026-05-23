const AppError = require("../utils/AppError");

// Usage: router.post("/", protect, restrictTo("admin", "organizer"), handler)
const restrictTo = (...roles) => (req, _res, next) => {
  if (!req.user) {
    return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
  }
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError("You do not have permission to perform this action", 403, "FORBIDDEN"),
    );
  }
  next();
};

module.exports = { restrictTo };
