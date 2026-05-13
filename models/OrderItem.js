const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Order",
      required: [true, "please provide an order for the order item"],
    },
    ticket: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Ticket",
      required: [true, "please provide a ticket for the order item"],
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
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("OrderItems", OrderItemSchema);
