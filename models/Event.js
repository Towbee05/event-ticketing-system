const mongoose = require("mongoose");

// Field	Type
// title	String
// description	String
// date	Date
// venue	String
// category	String
// organizerId	ObjectId
// status	String

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "please provide an event title"],
      unique: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "please provide the ID of event otganizer"],
    },
    description: {
      type: String,
      required: [true, "please add a short description for event"],
    },
    date: {
      type: Date,
      required: [true, "please provide a date for the event"],
    },
    venue: {
      type: String,
      required: [true, "please provide a venue for the event"],
    },
    category: {
      type: String,
    },
    bannerImage: {
      type: String,
    },
    status: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Event", EventSchema);
