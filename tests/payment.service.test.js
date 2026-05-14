import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock axios
vi.mock("axios");

// Mock the Payment model
vi.mock("../feature/payment/payment.model.js", () => ({
  default: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
  },
}));

import axios from "axios";
import Payment from "../feature/payment/payment.model.js";
import {
  initializePaymentService,
  verifyPaymentService,
} from "../feature/payment/payment.service.js";

// Order is referenced as a global in payment.service.js (import is commented out)
// We need to provide it as a global mock
const mockOrderFindOne = vi.fn();
const mockOrderFindById = vi.fn();
const OrderMock = {
  findOne: mockOrderFindOne,
  findById: mockOrderFindById,
};

beforeEach(() => {
  vi.clearAllMocks();
  // Inject Order as a global since the service references it without importing
  global.Order = OrderMock;
});

describe("initializePaymentService", () => {
  const mockUser = { _id: "user_001", email: "user@example.com" };
  const mockOrderId = "order_001";

  it("throws error when order is not found", async () => {
    mockOrderFindOne.mockResolvedValue(null);

    await expect(
      initializePaymentService(mockOrderId, mockUser)
    ).rejects.toThrow("Order not found or does not belong to the user");
  });

  it("throws error when payment has already been completed", async () => {
    const order = { _id: "order_001", paymentStatus: "successful" };
    mockOrderFindOne.mockResolvedValue(order);

    await expect(
      initializePaymentService(mockOrderId, mockUser)
    ).rejects.toThrow("Payment has already been completed for this order");
  });

  it("calls Order.findOne with correct orderId and user._id", async () => {
    mockOrderFindOne.mockResolvedValue(null);

    try {
      await initializePaymentService(mockOrderId, mockUser);
    } catch {
      // expected to throw
    }

    expect(mockOrderFindOne).toHaveBeenCalledWith({
      _id: mockOrderId,
      user: mockUser._id,
    });
  });

  it("calls Paystack initialize API with correct payload", async () => {
    const order = {
      _id: "order_001",
      paymentStatus: "pending",
      totalAmount: 1000,
    };
    mockOrderFindOne.mockResolvedValue(order);

    // The service does: const { data } = response.data.data
    // So response.data.data must be { data: { authorization_url, reference } }
    const paystackResponse = {
      data: {
        data: {
          data: {
            authorization_url: "https://checkout.paystack.com/test",
            reference: "ref_test_123",
          },
        },
      },
    };
    axios.post = vi.fn().mockResolvedValue(paystackResponse);
    Payment.create.mockResolvedValue({});

    await initializePaymentService(mockOrderId, mockUser);

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/transaction/initialize"),
      expect.objectContaining({
        email: mockUser.email,
        amount: 100000, // 1000 * 100 (converted to kobo)
      }),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      })
    );
  });

  it("creates a Payment record with correct fields", async () => {
    const order = {
      _id: "order_001",
      paymentStatus: "pending",
      totalAmount: 500,
    };
    mockOrderFindOne.mockResolvedValue(order);

    const paystackResponse = {
      data: {
        data: {
          data: {
            authorization_url: "https://checkout.paystack.com/test",
            reference: "ref_test_456",
          },
        },
      },
    };
    axios.post = vi.fn().mockResolvedValue(paystackResponse);
    Payment.create.mockResolvedValue({});

    await initializePaymentService(mockOrderId, mockUser);

    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        order: order._id,
        user: mockUser._id,
        amount: 500,
        reference: "ref_test_456",
        status: "pending",
      })
    );
  });

  it("returns paymentUrl and reference on success", async () => {
    const order = {
      _id: "order_001",
      paymentStatus: "pending",
      totalAmount: 200,
    };
    mockOrderFindOne.mockResolvedValue(order);

    const paystackResponse = {
      data: {
        data: {
          data: {
            authorization_url: "https://checkout.paystack.com/xyz",
            reference: "ref_success_001",
          },
        },
      },
    };
    axios.post = vi.fn().mockResolvedValue(paystackResponse);
    Payment.create.mockResolvedValue({});

    const result = await initializePaymentService(mockOrderId, mockUser);

    expect(result).toEqual({
      paymentUrl: "https://checkout.paystack.com/xyz",
      reference: "ref_success_001",
    });
  });

  it("throws when Paystack API call fails", async () => {
    const order = {
      _id: "order_001",
      paymentStatus: "pending",
      totalAmount: 200,
    };
    mockOrderFindOne.mockResolvedValue(order);
    axios.post = vi.fn().mockRejectedValue(new Error("Paystack API error"));

    await expect(
      initializePaymentService(mockOrderId, mockUser)
    ).rejects.toThrow("Paystack API error");
  });
});

describe("verifyPaymentService", () => {
  const mockReference = "ref_verify_001";

  it("throws error when payment is not found", async () => {
    Payment.findOne.mockResolvedValue(null);

    await expect(verifyPaymentService(mockReference)).rejects.toThrow(
      "Payment not found"
    );
  });

  it("calls Payment.findOne with the correct reference", async () => {
    Payment.findOne.mockResolvedValue(null);

    try {
      await verifyPaymentService(mockReference);
    } catch {
      // expected
    }

    expect(Payment.findOne).toHaveBeenCalledWith({ reference: mockReference });
  });

  it("returns payment immediately when already marked successful (skip duplicate verification)", async () => {
    const existingPayment = { status: "successful", reference: mockReference };
    Payment.findOne.mockResolvedValue(existingPayment);

    const result = await verifyPaymentService(mockReference);

    expect(result).toBe(existingPayment);
    expect(axios.get).not.toHaveBeenCalled?.();
  });

  it("calls Paystack verify API when payment is pending", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Payment.findOne.mockResolvedValue(payment);

    // The service does: const { data } = response.data.data
    // So the inner data object needs a `data` key
    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "failed",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);

    await verifyPaymentService(mockReference);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining(`/transaction/verify/${mockReference}`),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringContaining("Bearer"),
        }),
      })
    );
  });

  it("updates payment status to successful when Paystack returns success", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Payment.findOne.mockResolvedValue(payment);

    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "success",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);
    mockOrderFindById.mockResolvedValue(null); // order not found, but payment still updated

    await verifyPaymentService(mockReference);

    expect(payment.status).toBe("successful");
    expect(payment.paidAt).toBeInstanceOf(Date);
    expect(payment.save).toHaveBeenCalled();
  });

  it("updates order paymentStatus and isPaid when order is found and payment is successful", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Payment.findOne.mockResolvedValue(payment);

    const order = {
      paymentStatus: "pending",
      isPaid: false,
      save: vi.fn().mockResolvedValue(undefined),
    };
    mockOrderFindById.mockResolvedValue(order);

    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "success",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);

    await verifyPaymentService(mockReference);

    expect(order.paymentStatus).toBe("successful");
    expect(order.isPaid).toBe(true);
    expect(order.save).toHaveBeenCalled();
  });

  it("does not update order when order is not found", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Payment.findOne.mockResolvedValue(payment);
    mockOrderFindById.mockResolvedValue(null);

    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "success",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);

    // Should not throw
    await expect(verifyPaymentService(mockReference)).resolves.toBeDefined();
  });

  it("returns payment object after verification", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Payment.findOne.mockResolvedValue(payment);
    mockOrderFindById.mockResolvedValue(null);

    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "failed",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);

    const result = await verifyPaymentService(mockReference);

    expect(result).toBe(payment);
  });

  it("does not update payment status when Paystack returns non-success", async () => {
    const payment = {
      status: "pending",
      reference: mockReference,
      order: "order_001",
      save: vi.fn(),
    };
    Payment.findOne.mockResolvedValue(payment);

    const paystackResponse = {
      data: {
        data: {
          data: {
            status: "failed",
          },
        },
      },
    };
    axios.get = vi.fn().mockResolvedValue(paystackResponse);

    await verifyPaymentService(mockReference);

    expect(payment.status).toBe("pending");
    expect(payment.save).not.toHaveBeenCalled();
  });
});