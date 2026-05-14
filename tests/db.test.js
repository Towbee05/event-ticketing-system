import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock mongoose before importing connectDB
vi.mock("mongoose", () => ({
  default: {
    connect: vi.fn(),
  },
}));

import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

describe("connectDB", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls mongoose.connect with the provided URL", async () => {
    mongoose.connect.mockResolvedValue(undefined);

    const url = "mongodb://localhost:27017/test-db";
    await connectDB(url);

    expect(mongoose.connect).toHaveBeenCalledWith(url);
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
  });

  it("calls mongoose.connect with the production URI", async () => {
    mongoose.connect.mockResolvedValue(undefined);

    const mongoUri =
      "mongodb+srv://user:pass@cluster.mongodb.net/event-ticketing";
    await connectDB(mongoUri);

    expect(mongoose.connect).toHaveBeenCalledWith(mongoUri);
  });

  it("resolves when mongoose.connect succeeds", async () => {
    mongoose.connect.mockResolvedValue(undefined);

    await expect(
      connectDB("mongodb://localhost:27017/test")
    ).resolves.toBeUndefined();
  });

  it("throws when mongoose.connect fails", async () => {
    const connectionError = new Error("Connection refused");
    mongoose.connect.mockRejectedValue(connectionError);

    await expect(
      connectDB("mongodb://localhost:27017/test")
    ).rejects.toThrow("Connection refused");
  });

  it("does not swallow the mongoose connection error", async () => {
    const networkError = new Error("ECONNREFUSED 127.0.0.1:27017");
    mongoose.connect.mockRejectedValue(networkError);

    let caughtError;
    try {
      await connectDB("mongodb://localhost:27017/test");
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBe(networkError);
  });
});