const dotenv = require("dotenv");
dotenv.config();

const app = require("./app.js");
const { connectDB } = require("./config/db.js");

const PORT = process.env.PORT || 5000;

// NOTE:
// app.js should ONLY configure express.
// server.js should handle:
// - database connection
// - environment variables
// - starting the server

const startServer = async () => {
  try {
    console.log("Connecting to database...");

    await connectDB(process.env.MONGO_URI);

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.log("Error starting server");
    console.log(error);

    process.exit(1);
  }
};

startServer();
