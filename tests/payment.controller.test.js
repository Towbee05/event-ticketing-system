import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the payment service
vi.mock("../feature/payment/payment.service.js", () => ({
  initializePaymentService: vi.fn(),
  verifyPaymentService: vi.fn(),
}));

import {
  initializePayment,
  verifyPayment,
} from "../feature/payment/payment.controller.js";
import {
  initializePaymentService,
  verifyPaymentService,
} from "../feature/payment/payment.service.js";

const makeReqRes = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { res, next };
};

describe("initializePayment controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when orderId is missing in body", async () => {
    const req = { body: {}, user: { _id: "user1" } };
    const { res, next } = makeReqRes();

    await initializePayment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it("returns 400 when orderId is empty string", async () => {
    const req = { body: { orderId: "" }, user: { _id: "user1" } };
    const { res, next } = makeReqRes();

    await initializePayment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it("calls initializePaymentService with orderId and req.user when validation passes", async () => {
    const paymentData = {
      paymentUrl: "https://checkout.paystack.com/xyz",
      reference: "ref_123",
    };
    initializePaymentService.mockResolvedValue(paymentData);

    const req = {
      body: { orderId: "order_abc" },
      user: { _id: "user1", email: "test@example.com" },
    };
    const { res, next } = makeReqRes();

    await initializePayment(req, res, next);

    expect(initializePaymentService).toHaveBeenCalledWith("order_abc", req.user);
  });

  it("responds with 200 and payment data on success", async () => {
    const paymentData = {
      paymentUrl: "https://checkout.paystack.com/xyz",
      reference: "ref_123",
    };
    initializePaymentService.mockResolvedValue(paymentData);

    const req = {
      body: { orderId: "order_abc" },
      user: { _id: "user1", email: "test@example.com" },
    };
    const { res, next } = makeReqRes();

    await initializePayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Payment initialized successfully",
      data: paymentData,
    });
  });

  it("calls next with error when service throws", async () => {
    const serviceError = new Error("Order not found");
    serviceError.statusCode = 404;
    initializePaymentService.mockRejectedValue(serviceError);

    const req = {
      body: { orderId: "order_abc" },
      user: { _id: "user1", email: "test@example.com" },
    };
    const { res, next } = makeReqRes();

    initializePayment(req, res, next);
    // asyncHandler fires a Promise internally without returning it;
    // drain microtasks so the .catch(next) callback has a chance to run
    await new Promise((r) => setImmediate(r));

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  it("does not call service when validation fails", async () => {
    const req = { body: {}, user: { _id: "user1" } };
    const { res, next } = makeReqRes();

    await initializePayment(req, res, next);

    expect(initializePaymentService).not.toHaveBeenCalled();
  });
});

describe("verifyPayment controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when reference is missing in body", async () => {
    const req = { body: {} };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it("returns 400 when reference is empty string", async () => {
    const req = { body: { reference: "" } };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    expect(next).toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error.statusCode).toBe(400);
  });

  it("calls verifyPaymentService with reference when validation passes", async () => {
    const paymentData = { status: "successful", reference: "ref_001" };
    verifyPaymentService.mockResolvedValue(paymentData);

    const req = { body: { reference: "ref_001" } };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    expect(verifyPaymentService).toHaveBeenCalledWith("ref_001");
  });

  it("responds with 200 and payment data on success", async () => {
    const paymentData = { status: "successful", reference: "ref_001" };
    verifyPaymentService.mockResolvedValue(paymentData);

    const req = { body: { reference: "ref_001" } };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Payment verified successfully",
      data: paymentData,
    });
  });

  it("calls next with error when service throws", async () => {
    const serviceError = new Error("Payment not found");
    verifyPaymentService.mockRejectedValue(serviceError);

    const req = { body: { reference: "ref_001" } };
    const { res, next } = makeReqRes();

    verifyPayment(req, res, next);
    // drain microtasks so .catch(next) callback runs
    await new Promise((r) => setImmediate(r));

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  it("does not call service when validation fails", async () => {
    const req = { body: {} };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    expect(verifyPaymentService).not.toHaveBeenCalled();
  });

  it("validation error message is included in thrown error", async () => {
    const req = { body: {} };
    const { res, next } = makeReqRes();

    await verifyPayment(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/reference/i);
  });
});