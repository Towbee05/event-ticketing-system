const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sanitize } = require("./auth.service");

const updateMe = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return sanitize(user);
};

// Escape special regex characters so a query like "(a+)+$" can't trigger
// catastrophic backtracking (ReDoS). Treats the input as a literal substring.
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const listUsers = ({ role, q } = {}) => {
  const filter = {};
  if (role) filter.role = role;
  if (q) {
    const safe = escapeRegex(q);
    filter.$or = [{ email: new RegExp(safe, "i") }, { name: new RegExp(safe, "i") }];
  }
  return User.find(filter).sort({ createdAt: -1 });
};

const updateRole = async (id, role) => {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true });
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return sanitize(user);
};

const deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
};

module.exports = { updateMe, listUsers, updateRole, deleteUser };
