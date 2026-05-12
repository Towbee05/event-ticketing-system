const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { registerValidation, forgotPasswordValidation } = require("./auth.validation");

router.post("/register", registerValidation, authController.register);
router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword);

module.exports = router;