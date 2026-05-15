const express = require("express");
const { initializePayment, verifyPayment } = require("./payment.controller.js");

const webhookRoutes = require("./payment.webhook.js");

// import { protect } from "../../middleware/auth.middleware.js";
// we will add authentication middleware later once we have user authentication set up

const router = express.Router();

// Payment routes

// initialize payment
router.post("/initialize", initializePayment);

// verify
router.post("/verify", verifyPayment);

// webhook to handle payment notifications from Paystack
router.use("/webhook", webhookRoutes);

module.exports = router;
