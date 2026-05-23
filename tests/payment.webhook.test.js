import { describe, it, expect, vi, beforeEach } from "vitest";
import crypto from "crypto";

// Mock the Payment model
vi.mock("../feature/payment/payment.model.js", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import Payment from "../feature/payment/payment.model.js";

const SECRET_KEY = "test_secret_key_for_webhook";

/**
 * Build a valid Paystack HMAC-SHA512 signature for a given body string.
 */
const buildSignature = (bodyStr, secret = SECRET_KEY) => {
  return crypto
    .createHmac("sha512", secret)
    .update(bodyStr)
    .digest("hex");
};

/**
 * Create a mock req/res pair that mimics what the webhook handler receives.
 * The webhook sets req.rawBody via express.json verify callback.
 */
const makeWebhookReqRes = (body, signature, overrideHeaders = {}) => {
  const bodyStr = JSON.stringify(body);
  const req = {
    body,
    rawBody: Buffer.from(bodyStr),
    headers: {
      "x-paystack-signature": signature,
      "content-type": "application/json",
      ...overrideHeaders,
    },
  };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
  };
  const next = vi.fn();
  return { req, res, next };
};

/**
 * Extract the actual async route handler from the webhook router.
 * The router defines: router.post("/", express.json({verify}), asyncHandler)
 * We extract the last handler in the middleware stack for the POST "/" route.
 */
const getWebhookHandler = async () => {
  const { default: router } = await import(
    "../feature/payment/payment.webhook.js"
  );
  // router.stack[0] is the POST "/" route
  const route = router.stack[0].route;
  const handlers = route.stack;
  // The actual business logic handler is the last in the stack
  const asyncHandler = handlers[handlers.length - 1].handle;
  return asyncHandler;
};

let handler;

beforeEach(async () => {
  vi.clearAllMocks();
  process.env.PAYSTACK_SECRET_KEY = SECRET_KEY;
  // Set up Order mock as global (referenced without import in webhook.js)
  global.Order = { findById: vi.fn() };
  if (!handler) {
    handler = await getWebhookHandler();
  }
});

describe("Payment Webhook Handler", () => {
  describe("Signature verification", () => {
    it("returns 401 when x-paystack-signature header is missing", async () => {
      const body = { event: "charge.success", data: { reference: "ref_001" } };
      const { req, res, next } = makeWebhookReqRes(body, undefined);
      delete req.headers["x-paystack-signature"];

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid signature",
      });
    });

    it("returns 401 when signature is invalid", async () => {
      const body = { event: "charge.success", data: { reference: "ref_001" } };
      const { req, res, next } = makeWebhookReqRes(body, "invalid_signature");

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid signature",
      });
    });

    it("returns 401 when signature uses wrong secret key", async () => {
      const body = { event: "charge.success", data: { reference: "ref_001" } };
      const bodyStr = JSON.stringify(body);
      const wrongSignature = buildSignature(bodyStr, "wrong_key");
      const { req, res, next } = makeWebhookReqRes(body, wrongSignature);

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("proceeds past signature check when signature is valid", async () => {
      Payment.findOne.mockResolvedValue(null);
      const body = {
        event: "charge.success",
        data: { reference: "ref_valid" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      // Should NOT return 401 when signature is valid
      expect(res.status).not.toHaveBeenCalledWith(401);
    });
  });

  describe("charge.success event handling", () => {
    it("returns 200 and ignores when payment is not found", async () => {
      Payment.findOne.mockResolvedValue(null);
      const body = {
        event: "charge.success",
        data: { reference: "ref_notfound" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    it("returns 200 without re-processing when payment is already successful", async () => {
      const payment = { status: "successful", reference: "ref_001" };
      Payment.findOne.mockResolvedValue(payment);

      const body = {
        event: "charge.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });

    it("does not call payment.save() when payment is already successful (idempotent)", async () => {
      const payment = {
        status: "successful",
        reference: "ref_001",
        save: vi.fn(),
      };
      Payment.findOne.mockResolvedValue(payment);

      const body = {
        event: "charge.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(payment.save).not.toHaveBeenCalled();
    });

    it("updates payment status to successful and sets paidAt", async () => {
      const payment = {
        status: "pending",
        reference: "ref_001",
        order: "order_001",
        save: vi.fn().mockResolvedValue(undefined),
      };
      Payment.findOne.mockResolvedValue(payment);
      global.Order.findById.mockResolvedValue(null);

      const body = {
        event: "charge.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(payment.status).toBe("successful");
      expect(payment.paidAt).toBeInstanceOf(Date);
      expect(payment.save).toHaveBeenCalled();
    });

    it("updates order paymentStatus and isPaid when order is found", async () => {
      const payment = {
        status: "pending",
        reference: "ref_001",
        order: "order_001",
        save: vi.fn().mockResolvedValue(undefined),
      };
      Payment.findOne.mockResolvedValue(payment);

      const order = {
        paymentStatus: "pending",
        isPaid: false,
        save: vi.fn().mockResolvedValue(undefined),
      };
      global.Order.findById.mockResolvedValue(order);

      const body = {
        event: "charge.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(order.paymentStatus).toBe("successful");
      expect(order.isPaid).toBe(true);
      expect(order.save).toHaveBeenCalled();
    });

    it("calls Payment.findOne with the reference from the event data", async () => {
      Payment.findOne.mockResolvedValue(null);

      const body = {
        event: "charge.success",
        data: { reference: "ref_specific_check" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(Payment.findOne).toHaveBeenCalledWith({
        reference: "ref_specific_check",
      });
    });

    it("returns 200 acknowledgement after processing valid charge.success", async () => {
      const payment = {
        status: "pending",
        reference: "ref_001",
        order: "order_001",
        save: vi.fn().mockResolvedValue(undefined),
      };
      Payment.findOne.mockResolvedValue(payment);
      global.Order.findById.mockResolvedValue(null);

      const body = {
        event: "charge.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
    });
  });

  describe("non-charge.success events", () => {
    it("acknowledges receipt with 200 for unhandled events without querying Payment", async () => {
      const body = {
        event: "transfer.success",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(res.sendStatus).toHaveBeenCalledWith(200);
      expect(Payment.findOne).not.toHaveBeenCalled();
    });

    it("does not update any data for unknown event types", async () => {
      const body = {
        event: "subscription.create",
        data: { reference: "ref_001" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(Payment.findOne).not.toHaveBeenCalled();
    });
  });

  describe("error handling", () => {
    it("returns 500 and error message when a DB error occurs during processing", async () => {
      Payment.findOne.mockRejectedValue(new Error("DB connection lost"));

      const body = {
        event: "charge.success",
        data: { reference: "ref_err" },
      };
      const bodyStr = JSON.stringify(body);
      const validSignature = buildSignature(bodyStr);
      const { req, res, next } = makeWebhookReqRes(body, validSignature);

      await handler(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Webhook server error",
      });
    });
  });
});
