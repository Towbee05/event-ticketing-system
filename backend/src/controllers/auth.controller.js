const catchAsync = require("../utils/catchAsync");
const { success } = require("../utils/response");
const authService = require("../services/auth.service");

const register = catchAsync(async (req, res) => {
  const data = await authService.register(req.body);
  success(res, { statusCode: 201, message: "Account created", data });
});

const login = catchAsync(async (req, res) => {
  const data = await authService.login(req.body);
  success(res, { message: "Logged in", data });
});

const me = catchAsync(async (req, res) => {
  const data = await authService.getMe(req.user.id);
  success(res, { data });
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);
  // Same response regardless of whether the email exists — prevents user enumeration.
  success(res, {
    message: "If an account exists for that email, a reset link has been sent",
    data: result.devToken ? { devToken: result.devToken } : undefined,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const data = await authService.resetPassword(req.body);
  success(res, { message: "Password reset successful", data });
});

const changePassword = catchAsync(async (req, res) => {
  const data = await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  success(res, { message: "Password changed", data });
});

module.exports = { register, login, me, forgotPassword, resetPassword, changePassword };
