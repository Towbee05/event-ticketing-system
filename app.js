const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db");
const swaggerUI = require("swagger-ui-express");
const swaggerFile = require("./swagger-out.json");

const ticketRoutes = require("./routes/Tickets");
const orderItemRoutes = require("./routes/orderItem");
dotenv.config();
const app = express();
// swagger docs is configured to run on port 5000
const PORT = process.env.PORT || 5000;

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerFile));
app.use(express.json());

app.use("/api/v1/tickets", ticketRoutes);
app.use("/api/v1/order-items", orderItemRoutes);

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
