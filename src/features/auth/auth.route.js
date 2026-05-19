const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");
const { registerValidation, forgotPasswordValidation } = require("./auth.validation");
const { protect } = require("../../middleware/auth.middleware");
const { restrictTo } = require("../../middleware/role.middleware");

router.post("/register/attendee", registerValidation, authController.registerAttendee);
router.post("/register/organizer", registerValidation, authController.registerOrganizer);
router.post("/register/admin", protect, restrictTo("admin"), registerValidation, authController.registerAdmin);
router.post("/forgot-password", forgotPasswordValidation, authController.forgotPassword);

module.exports = router;