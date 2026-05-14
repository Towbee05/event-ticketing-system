import express from "express";
import cors from "cors";

import paymentRoutes from "./feature/payment/payment.route.js";

import errorMiddleware from "./middleware/error.middleware.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

app.use("/api/payments", paymentRoutes);

// Error handling middleware
app.use(errorMiddleware);

export default app;
