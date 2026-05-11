const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Order",
    },
    paymentReference: {
      type: String,
    },
    provider: {
      type: String,
    },
    amount: {
      type: mongoose.SchemaTypes.Decimal128,
    },
    status: {
      type: String,
      enum: {
        value: ["pending", "successful", "failed"],
        message: "{VALUE} is not supported.",
      },
    },
    paidAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Payment", PaymentSchema);
