const app = require("./app");
const db = require("./config/db");

const PORT = process.env.PORT || 5000;

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
