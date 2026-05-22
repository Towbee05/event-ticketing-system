const mongoose = require("mongoose");
const crypto = require("crypto");

// One row per actual seat (versus models/Tickets.js which represents a ticket TYPE
// like "Regular at ₦1000, qty 50, sold 12"). Each row has a unique scannable code
// the holder presents at the door.

const IssuedTicketSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    orderItem: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "OrderItems",
      required: true,
    },
    event: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    holder: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ticketType: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Ticket",
    },
    // 12-char hex, uppercase. Unique per row, embedded in the QR.
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["valid", "used", "cancelled"],
        message: "{VALUE} is not supported",
      },
      default: "valid",
    },
    usedAt: { type: Date },
    usedBy: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

IssuedTicketSchema.statics.generateCode = () =>
  crypto.randomBytes(6).toString("hex").toUpperCase();

module.exports = mongoose.model("IssuedTicket", IssuedTicketSchema);
