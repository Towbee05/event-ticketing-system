const mongoose = require("mongoose");

const TicketSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Event",
      required: [true, "please provide an event for ticket"],
    },
    ticketType: {
      type: String,
      enum: {
        values: ["early-bird", "regular", "vip-ticket"],
        message: "{VALUE} is not supported",
      },
    },
    price: {
      type: mongoose.SchemaTypes.Decimal128,
      required: [true, "please provide a price"],
    },
    quantity: {
      type: Number,
      required: [true, "please provide a price"],
    },
    sold: {
      type: Number,
      default: 0,
    },
    salesStartDate: {
      type: Date,
      default: Date.now,
    },
    salesEndDate: {
      type: Date,
      required: [true, "please provide the date sales stop"],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Ticket", TicketSchema);
