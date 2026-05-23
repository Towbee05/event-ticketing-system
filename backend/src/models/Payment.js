const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    provider: {
      type: String,
      default: "paystack",
    },
    amount: {
      type: mongoose.SchemaTypes.Decimal128,
      required: true,
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "successful", "failed"],
        message: "{VALUE} is not supported.",
      },
      default: "pending",
    },
    paidAt: {
      type: Date,
    },
    // Raw provider response payload — useful for debugging + reconciliation.
    providerData: {
      type: mongoose.SchemaTypes.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Payment", PaymentSchema);
