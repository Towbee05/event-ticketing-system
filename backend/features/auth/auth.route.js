const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const controller = require("./auth.controller");
const {
  validateRegister,
  validateLogin,
  validateForgot,
  validateReset,
  validateChangePassword,
} = require("./auth.validation");

const router = express.Router();

router.post("/register", validateRegister, controller.register);
router.post("/login", validateLogin, controller.login);
router.post("/forgot-password", validateForgot, controller.forgotPassword);
router.post("/reset-password", validateReset, controller.resetPassword);

router.get("/me", protect, controller.me);
router.post("/change-password", protect, validateChangePassword, controller.changePassword);

module.exports = router;
