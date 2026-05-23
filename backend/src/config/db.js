const mongoose = require("mongoose");

// If USE_MEMORY_DB=true, spin up an in-process MongoDB (data is ephemeral).
// Useful for dev when you don't have a local mongod or an Atlas URI.
async function startMemoryServer() {
  // Lazy-require so production deployments don't pay the cost when not using it.
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const { MongoMemoryServer } = require("mongodb-memory-server");
  const mongod = await MongoMemoryServer.create({
    // Generous timeouts for first-run download + slower disks / Windows AV scans.
    instance: { launchTimeout: 60000 },
    binary: { checkMD5: false },
  });
  const uri = mongod.getUri();
  console.log(`🧪 Using mongodb-memory-server at ${uri}`);

  // Stop the in-memory server cleanly on shutdown so the binary releases.
  const stop = async () => {
    try {
      await mongoose.disconnect();
    } catch {
      /* noop */
    }
    await mongod.stop();
  };
  process.once("SIGINT", () => stop().then(() => process.exit(0)));
  process.once("SIGTERM", () => stop().then(() => process.exit(0)));

  return uri;
}

async function connectDB(uri) {
  let target = uri;
  if (process.env.USE_MEMORY_DB === "true") {
    target = await startMemoryServer();
  }
  if (!target) {
    throw new Error(
      "No MongoDB URI configured. Set MONGO_URI in backend/.env or USE_MEMORY_DB=true.",
    );
  }
  return mongoose.connect(target);
}

module.exports = { connectDB };
