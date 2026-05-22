const mongoose = require("mongoose");
const AppError = require("../../pkg/utils/AppError");

const validateIdParam = (req, _res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return next(new AppError("Invalid notification id", 400, "INVALID_ID"));
  }
  next();
};

module.exports = { validateIdParam };
