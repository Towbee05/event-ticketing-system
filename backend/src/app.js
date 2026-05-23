const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./config/db");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-out.json");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

dotenv.config({ path: path.join(__dirname, "..", ".env") });
const app = express();
const PORT = process.env.PORT || 5000;

// ---- CORS ---------------------------------------------------------------
// Allow the Vite dev server and any origin set in CORS_ORIGIN (comma-separated).
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "x-user-id", "x-user-role"],
  }),
);

// ---- Request logging ----------------------------------------------------
// dev format locally, combined format in production. Silent during automated tests.
if (process.env.NODE_ENV !== "test") {
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
}

app.use(express.json());

// ---- API docs -----------------------------------------------------------
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));

// ---- Auth rate limit ----------------------------------------------------
// 20 attempts per 15 min per IP — slows brute force on login/forgot-password
// without blocking real users. Disabled in test for the test runner's sake.
if (process.env.NODE_ENV !== "test") {
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many auth attempts — please wait 15 minutes",
      code: "RATE_LIMITED",
    },
  });
  app.use("/api/auth", authLimiter);
}

// ---- Routes -------------------------------------------------------------
// Mount each route module explicitly so reviewers can see the surface area at a glance.
app.use("/api/auth", require("./routes/auth.route"));
app.use("/api/users", require("./routes/user.route"));
app.use("/api/events", require("./routes/event.route"));
app.use("/api/categories", require("./routes/category.route"));
app.use("/api/tickets", require("./routes/ticket.route"));
app.use("/api/orders", require("./routes/order.route"));
app.use("/api/payments", require("./routes/payment.route"));
app.use("/api/notifications", require("./routes/notification.route"));

// ---- Health -------------------------------------------------------------
app.get("/health", (_req, res) => res.json({ success: true, status: "ok" }));

// ---- 404 + centralised error handler — must be mounted last -----------
app.use(notFound);
app.use(errorHandler);

// ---- Bootstrap ----------------------------------------------------------
app.listen(PORT, async () => {
  try {
    console.log("⌛ Connecting to db...");
    await db.connectDB(process.env.MONGO_URI);
    console.log("✅ Successful connection to db.");
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
    console.log(`📚 Docs is running at http://localhost:${PORT}/api-docs`);
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
});
