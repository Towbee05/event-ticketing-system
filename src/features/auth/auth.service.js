const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../users/user.model");

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const registerUser = async (data) => {
  const { name, email, password, role } = data;


  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email is already registered");
  }

 
  const user = await User.create({ name, email, password, role });

 
  const token = generateToken(user._id, user.role);

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};


const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("No account found with that email");
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save({ validateBeforeSave: false });

 
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Event Ticketing" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below to reset your password.</p>
      <p>This link expires in <strong>15 minutes</strong>.</p>
      <a href="${resetURL}" target="_blank">${resetURL}</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  return { message: "Password reset link sent to your email" };
};

module.exports = {
  registerUser,
  forgotPassword,
};