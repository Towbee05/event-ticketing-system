const catchAsync = require("../utils/catchAsync");
const { success } = require("../utils/response");
const userService = require("../services/user.service");

const updateMe = catchAsync(async (req, res) => {
  const data = await userService.updateMe(req.user.id, req.body);
  success(res, { message: "Profile updated", data });
});

const list = catchAsync(async (req, res) => {
  const data = await userService.listUsers({ role: req.query.role, q: req.query.q });
  success(res, { data });
});

const updateRole = catchAsync(async (req, res) => {
  const data = await userService.updateRole(req.params.id, req.body.role);
  success(res, { message: "Role updated", data });
});

const remove = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  success(res, { message: "User deleted" });
});

module.exports = { updateMe, list, updateRole, remove };
