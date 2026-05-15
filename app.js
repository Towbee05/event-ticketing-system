const express = require("express");
const cors = require("cors");

const paymentRoutes = require("./feature/payment/payment.route.js");
const errorMiddleware = require("./middleware/error.middleware.js");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/payments", paymentRoutes);

// Error handling middleware
app.use(errorMiddleware);

module.exports = app;
