const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
        validator: (v) => /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v),
        message: "please provide a valid email address",
      },
    },
    password: {
      type: String,
      required: [true, "please provide a user password"],
      minlength: [8, "password must be at least 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ["admin", "organizer", "attendee"],
        message: "role does not support {VALUE}",
      },
      default: "attendee",
    },
    profileImage: { type: String },

    // Password reset — token is stored hashed; only the plaintext goes to the user.
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },

    // Used to invalidate JWTs issued before a password change.
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true },
);

// Hash password on create or when it changes. Mongoose awaits async pre-save hooks;
// declaring next as a parameter is wrong (it'll be undefined and crash on invocation).
UserSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
  // Set 1s in the past so a JWT issued immediately after isn't flagged as stale.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// True if the token was issued before the most recent password change.
UserSchema.methods.passwordChangedAfter = function passwordChangedAfter(jwtIssuedAtSec) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > jwtIssuedAtSec;
};

// Issues a plaintext reset token (returned once to caller) and stores its hash + expiry.
UserSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
  this.passwordResetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min
  return token;
};

module.exports = mongoose.model("User", UserSchema);
