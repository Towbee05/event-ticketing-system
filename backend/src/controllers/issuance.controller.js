const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/AppError");
const { success } = require("../utils/response");
const issuance = require("../services/issuance.service");

const mine = catchAsync(async (req, res) => {
  const data = await issuance.listForUser(req.user.id);
  success(res, { data });
});

const lookup = catchAsync(async (req, res) => {
  const data = await issuance.lookupByCode(req.params.code);
  success(res, { data });
});

const validate = catchAsync(async (req, res) => {
  const code = (req.body?.code || "").toString().trim();
  if (!code) throw new AppError("code is required", 400, "MISSING_CODE");
  const data = await issuance.validate(code, req.user);
  success(res, { message: "Ticket validated", data });
});

module.exports = { mine, lookup, validate };
