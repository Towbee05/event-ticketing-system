const express = require("express");
const dotenv = require("dotenv");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-out.json");
const authRoutes = require("./internal/auth/auth.route");

dotenv.config();
const app = express();

app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));
app.use("/api/v1/auth", authRoutes);

module.exports = app;
