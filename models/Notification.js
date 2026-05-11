// {
//   _id: ObjectId,

//   user: {
//     type: ObjectId,
//     ref: "User"
//   },

//   title: String,

//   message: String,

//   isRead: {
//     type: Boolean,
//     default: false
//   },

//   createdAt: Date,
//   updatedAt: Date
// }

const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: [true, "please provide a notification title."],
    },
    message: {
      type: String,
      required: [true, "please provide a notification content."],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Notification", NotificationSchema);
