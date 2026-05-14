import express from "express";
import { initializePayment, verifyPayment } from "./payment.controller.js";

import webhookRoutes from "./payment.webhook.js";

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

export default router;
