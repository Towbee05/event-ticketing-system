import { describe, it, expect, vi } from "vitest";
import asyncHandler from "../shared/asynHandler.js";

describe("asyncHandler", () => {
  it("returns a middleware function", () => {
    const fn = vi.fn();
    const middleware = asyncHandler(fn);
    expect(typeof middleware).toBe("function");
  });

  it("calls the wrapped function with req, res, next", async () => {
    const fn = vi.fn().mockResolvedValue(undefined);
    const middleware = asyncHandler(fn);

    const req = {};
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it("does not call next when wrapped function resolves successfully", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const middleware = asyncHandler(fn);

    const req = {};
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
  });

  it("calls next with the error when the wrapped function rejects", async () => {
    const error = new Error("async error");
    const fn = vi.fn().mockRejectedValue(error);
    const middleware = asyncHandler(fn);

    const req = {};
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });

  it("does not catch synchronous throws in next() (only async rejections are forwarded)", async () => {
    // Note: the implementation uses Promise.resolve(fn()).catch(next)
    // If fn() throws synchronously, it propagates out before Promise.resolve can wrap it.
    // This means next() is NOT called — the caller will see the raw throw.
    const error = new Error("sync error");
    const fn = vi.fn().mockImplementation(() => {
      throw error;
    });
    const middleware = asyncHandler(fn);

    const req = {};
    const res = {};
    const next = vi.fn();

    let thrownError;
    try {
      middleware(req, res, next);
    } catch (err) {
      thrownError = err;
    }

    // Synchronous throw propagates out; next() is NOT called
    expect(thrownError).toBe(error);
    expect(next).not.toHaveBeenCalled();
  });

  it("passes a custom statusCode error through to next", async () => {
    const error = Object.assign(new Error("bad request"), { statusCode: 400 });
    const fn = vi.fn().mockRejectedValue(error);
    const middleware = asyncHandler(fn);

    const req = {};
    const res = {};
    const next = vi.fn();

    await middleware(req, res, next);

    const capturedError = next.mock.calls[0][0];
    expect(capturedError.statusCode).toBe(400);
    expect(capturedError.message).toBe("bad request");
  });
});