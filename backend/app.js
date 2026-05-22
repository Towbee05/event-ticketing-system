const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const db = require("./config/db");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-out.json");
const { notFound, errorHandler } = require("./middleware/error.middleware");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow the Vite dev server and any origin set in CORS_ORIGIN (comma-separated).
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

app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));

// Rate limit auth endpoints to slow brute-force on login/forgot-password.
// 20 attempts per 15 min per IP is tight enough to deter while not blocking real users.
// Disabled when NODE_ENV=test so tests don't trip it.
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

// Feature-based routes — picks up the first `*.route.js` inside each features/<name>/ folder.
// Folder name (pluralised, as in features/tickets/) is the mount path. The route file inside
// can be named singularly (PRD convention: features/tickets/ticket.route.js).
// `auth` is mounted as-is since the folder is already singular.
const featuresPath = path.join(__dirname, "features");
if (fs.existsSync(featuresPath)) {
  fs.readdirSync(featuresPath).forEach((feature) => {
    const featureDir = path.join(featuresPath, feature);
    if (!fs.statSync(featureDir).isDirectory()) return;
    const routeFileName = fs.readdirSync(featureDir).find((f) => f.endsWith(".route.js"));
    if (!routeFileName) return;
    app.use(`/api/${feature}`, require(path.join(featureDir, routeFileName)));
  });
}

// 404 + centralised error handler — must be mounted last.
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  try {
    console.log("⌛ Connecting to db...");
    await db.connectDB(process.env.MONGO_URI);
    console.log("✅ Successful connection to db.");
    console.log(`🚀 Server is running at http://localhost:${PORT}`);
    console.log(`📚 Docs is running at http://localhost:${PORT}/api-docs`);
  } catch (err) {
    console.log("An error occured while starting server");
    console.log(err);
    process.exit(1);
  }
});
