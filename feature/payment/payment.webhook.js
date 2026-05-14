import express from "express";
import crypto from "crypto";

import Payment from "./payment.model.js";
// import Order from "../order/order.model";

const router = express.Router();

// Webhook to handle payment notifications from Paystack
// This endpoint will be called by Paystack when a payment is completed
router.post(
  "/",
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  }),

  async (req, res) => {
    try {
      // generate hash of the request body using Paystack secret key
      const hash = crypto
        .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
        .update(req.rawBody.toString())
        .digest("hex");

      // paystack signature
      const signature = req.headers["x-paystack-signature"];

      // verify webhook source
      if (hash !== signature) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid signature" });
      }

      //   event data from paystack
      const event = req.body;

      // handle payment successful event
      if (event.event === "charge.success") {
        const reference = event.data.reference;

        // find payment by reference
        const payment = await Payment.findOne({ reference });

        // if payment not found, ignore the webhook
        if (!payment) {
          return res.sendStatus(200);
        }

        // prevent duplicate
        if (payment.status === "successful") {
          return res.sendStatus(200);
        }

        // update payment status to successful
        payment.status = "successful";
        payment.paidAt = new Date();

        await payment.save();

        // update order payment status
        const order = await Order.findById(payment.order);

        if (order) {
          order.paymentStatus = "successful";
          order.isPaid = true;

          await order.save();
        }

        console.log("webhook payment successful");
      }
      //   acknowledge receipt of the webhook
      res.sendStatus(200);
    } catch (error) {
      console.error("webhook error:", error.message);
      res.status(500).json({ success: false, message: "Webhook server error" });
    }
  },
);

export default router;
