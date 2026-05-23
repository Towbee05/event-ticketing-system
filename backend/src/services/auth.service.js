const crypto = require("crypto");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");
const notifications = require("./notification.service");

const sanitize = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  createdAt: user.createdAt,
});

const register = async ({ name, email, password, role }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError("An account with this email already exists", 409, "EMAIL_TAKEN");
  }
  const user = await User.create({
    name,
    email,
    password,
    role: role || "attendee",
  });
  return { user: sanitize(user), token: signToken(user) };
};

const login = async ({ email, password }) => {
  // password has select:false, so we explicitly include it for the compare.
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
  }
  return { user: sanitize(user), token: signToken(user) };
};

const requestPasswordReset = async ({ email }) => {
  const user = await User.findOne({ email });
  // Don't leak which emails exist — always return success-shaped result.
  if (!user) return { dispatched: false, devToken: null };

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5174").replace(/\/$/, "");
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  // Dispatch via the notification service: in-app + email transport.
  notifications
    .dispatch({
      userId: user._id,
      email: user.email,
      title: "Password reset requested",
      message: `Use this link to set a new password (valid for 30 minutes): ${resetUrl}`,
    })
    .catch((e) => console.error("[auth] reset notification failed:", e.message));

  // Return the raw token in dev so testers can complete the flow without checking email.
  const devToken = process.env.NODE_ENV === "production" ? null : token;
  return { dispatched: true, devToken };
};

const resetPassword = async ({ token, password }) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpiresAt");

  if (!user) {
    throw new AppError("Reset token is invalid or has expired", 400, "RESET_TOKEN_INVALID");
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return { user: sanitize(user), token: signToken(user) };
};

const changePassword = async ({ userId, currentPassword, newPassword }) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
  }
  user.password = newPassword;
  await user.save();
  return { user: sanitize(user), token: signToken(user) };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return sanitize(user);
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  resetPassword,
  changePassword,
  getMe,
  sanitize,
};
