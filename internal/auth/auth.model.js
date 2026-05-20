const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please provide a user name"],
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "please provide a user email"],
      unique: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: (v) => {
          return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: (props) => "please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "please provide a user password"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "organizer", "attendee"],
        message: "roles does not support {VALUES}",
      },
      default: "attendee",
    },
    profileImage: {
      type: String,
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", UserSchema);