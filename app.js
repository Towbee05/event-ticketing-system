const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./config/db");
const authRoute = require("./src/features/auth/auth.route");
const paymentRoutes = require("./feature/payment/payment.route.js");
const errorMiddleware = require("./middleware/error.middleware.js");

dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/api/auth", authRoute);
app.use("/api/payments", paymentRoutes);


app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Event Ticketing API is running",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

const bootstrap = async () => {
  try {
    console.log("Connecting to db...");
    await db.connectDB(process.env.MONGO_URI);
    console.log("Successful connection to db.");
    app.listen(PORT, () => {
      console.log("Server started successfully");
    });
  } catch (err) {
    console.log("An error occured while starting server");
    console.log(err);
    process.exit(1);
  }
};

bootstrap();