const express = require("express");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const db = require("./config/db");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-out.json");

dotenv.config();
const app = express();
// swagger docs is configured to run on port 5000
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));

// Dynamically load all routes from ./routes/*.js
const routesPath = path.join(__dirname, "routes");
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".js")) {
    const routeName = file.replace("Routes.js", "").toLowerCase();
    const routeModule = require(`./routes/${file}`);
    app.use(`/api/${routeName}s`, routeModule);
  }
});

const server = app.listen(PORT, async () => {
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
