import { describe, it, expect, vi } from "vitest";
import errorMiddleware from "../middleware/error.middleware.js";

describe("errorMiddleware", () => {
  const makeRes = () => {
    const res = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res;
  };

  it("uses err.statusCode when provided", () => {
    const err = { statusCode: 404, message: "Not found" };
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not found",
    });
  });

  it("defaults to status 500 when statusCode is not provided", () => {
    const err = { message: "Something went wrong" };
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Something went wrong",
    });
  });

  it("defaults to 'Server Error' when message is not provided", () => {
    const err = {};
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Server Error",
    });
  });

  it("always sets success to false in the response", () => {
    const err = { statusCode: 200, message: "Even a 200 error" };
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    const jsonArg = res.json.mock.calls[0][0];
    expect(jsonArg.success).toBe(false);
  });

  it("handles 400 bad request errors", () => {
    const err = { statusCode: 400, message: '"orderId" is required' };
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: '"orderId" is required',
    });
  });

  it("handles 401 unauthorized errors", () => {
    const err = { statusCode: 401, message: "Unauthorized" };
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("handles Error objects (with statusCode attached)", () => {
    const err = Object.assign(new Error("DB connection failed"), {
      statusCode: 503,
    });
    const req = {};
    const res = makeRes();
    const next = vi.fn();

    errorMiddleware(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "DB connection failed",
    });
  });
});