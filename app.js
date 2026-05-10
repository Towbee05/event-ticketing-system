const express = require("express");
const dotenv = require("dotenv");
const db = require("./config/db");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  try {
    console.log("Connecting to db...");
    await db.connectDB(process.env.MONGO_URI);
    console.log("Successful connection to db.");
    console.log("Server started successfully");
  } catch (err) {
    console.log("An error occured while starting server");
    console.log(err);
    process.exit(1);
  }
});
