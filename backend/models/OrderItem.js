const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Order",
    },
    ticket: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Ticket",
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: mongoose.SchemaTypes.Decimal128,
      required: [true, "please provide a price for item"],
      min: [0, "Quantity must be greater or equal to zero"],
    },
    subTotal: {
      type: Number,
      required: [true, "please provide a subtotal for order item"],
      min: [0, "Quantity must be greater or equal to zero"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("OrderItems", OrderItemSchema);
