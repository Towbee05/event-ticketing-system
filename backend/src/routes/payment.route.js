const express = require("express");
const { protect, attachUser } = require("../middlewares/auth.middleware");
const controller = require("../controllers/payment.controller");
const { validateInit, validateVerify } = require("../validations/payment.validation");

const router = express.Router();

// Initialise — must be authenticated (we use the user to authorise the order + email Paystack).
router.post("/initialize", protect, validateInit, controller.initialize);

// Verify — optional auth. Verification can be triggered from the redirect callback
// where the user is already logged in, OR from a webhook (no token). When no user
// is attached, the service still resolves by payment reference.
router.post("/verify", attachUser, validateVerify, controller.verify);
router.get("/verify", attachUser, validateVerify, controller.verify);

router.get("/order/:orderId", protect, controller.listForOrder);

module.exports = router;
