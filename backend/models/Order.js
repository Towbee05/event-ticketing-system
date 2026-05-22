const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: [true, "please provide a user for the order"],
    },
    event: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Event",
      required: [true, "please provide an event for the order"],
    },
    totalAmount: {
      type: mongoose.SchemaTypes.Decimal128,
    },
    paymentStatus: {
      type: String,
      enum: {
        values: ["pending", "paid", "failed"],
        message: "{VALUE} is not supported",
      },
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: {
        values: ["pending", "completed", "cancelled"],
        message: "{VALUE} is not supported",
      },
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Order", OrderSchema);
