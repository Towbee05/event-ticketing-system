import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import Payment from "../feature/payment/payment.model.js";

describe("Payment Model Schema", () => {
  const schema = Payment.schema;

  describe("schema paths definition", () => {
    it("has an 'order' field", () => {
      expect(schema.paths.order).toBeDefined();
    });

    it("requires 'order' field", () => {
      expect(schema.paths.order.isRequired).toBe(true);
    });

    it("order field references 'Order' model", () => {
      expect(schema.paths.order.options.ref).toBe("Order");
    });

    it("has a 'user' field", () => {
      expect(schema.paths.user).toBeDefined();
    });

    it("requires 'user' field", () => {
      expect(schema.paths.user.isRequired).toBe(true);
    });

    it("user field references 'User' model", () => {
      expect(schema.paths.user.options.ref).toBe("User");
    });

    it("has an 'amount' field of type Number", () => {
      expect(schema.paths.amount).toBeDefined();
      expect(schema.paths.amount.instance).toBe("Number");
    });

    it("requires 'amount' field", () => {
      expect(schema.paths.amount.isRequired).toBe(true);
    });

    it("has a 'reference' field of type String", () => {
      expect(schema.paths.reference).toBeDefined();
      expect(schema.paths.reference.instance).toBe("String");
    });

    it("requires 'reference' field", () => {
      expect(schema.paths.reference.isRequired).toBe(true);
    });

    it("reference field has unique constraint", () => {
      expect(schema.paths.reference.options.unique).toBe(true);
    });

    it("has a 'provider' field of type String", () => {
      expect(schema.paths.provider).toBeDefined();
      expect(schema.paths.provider.instance).toBe("String");
    });

    it("provider field defaults to 'Paystack'", () => {
      expect(schema.paths.provider.defaultValue).toBe("Paystack");
    });

    it("has a 'status' field of type String", () => {
      expect(schema.paths.status).toBeDefined();
      expect(schema.paths.status.instance).toBe("String");
    });

    it("status field has enum values ['pending', 'completed', 'failed']", () => {
      expect(schema.paths.status.enumValues).toEqual([
        "pending",
        "completed",
        "failed",
      ]);
    });

    it("status field defaults to 'pending'", () => {
      expect(schema.paths.status.defaultValue).toBe("pending");
    });

    it("has a 'paidAt' field of type Date", () => {
      expect(schema.paths.paidAt).toBeDefined();
      expect(schema.paths.paidAt.instance).toBe("Date");
    });

    it("paidAt field is optional (not required)", () => {
      expect(schema.paths.paidAt.isRequired).toBeFalsy();
    });
  });

  describe("schema options", () => {
    it("has timestamps enabled", () => {
      expect(schema.options.timestamps).toBe(true);
    });
  });

  describe("model name", () => {
    it("is named 'Payment'", () => {
      expect(Payment.modelName).toBe("Payment");
    });
  });

  describe("order and user field types", () => {
    it("order is an ObjectId type", () => {
      expect(schema.paths.order.instance).toBe("ObjectId");
    });

    it("user is an ObjectId type", () => {
      expect(schema.paths.user.instance).toBe("ObjectId");
    });
  });
});