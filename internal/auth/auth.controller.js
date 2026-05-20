const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("./auth.model");

const signup = (role) => async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "a user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "an error occurred while creating account" });
  }
};

const generateRefreshToken = (userId, role) => {
  const refreshToken = jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d" },
  );
  const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
  return { refreshToken, hashedToken };
};

const login = (role) => async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: `this account is not registered as a ${role}` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    const { refreshToken, hashedToken } = generateRefreshToken(user._id, user.role);
    user.refreshToken = hashedToken;
    await user.save();

    res.status(200).json({
      message: `${role} logged in successfully`,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "an error occurred while logging in" });
  }
};

const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: "refresh token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "invalid or expired refresh token" });
    }

    const hashedToken = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const user = await User.findOne({ _id: decoded.id, refreshToken: hashedToken }).select("+refreshToken");

    if (!user) {
      return res.status(401).json({ message: "invalid refresh token" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    const newRefresh = generateRefreshToken(user._id, user.role);
    user.refreshToken = newRefresh.hashedToken;
    await user.save();

    res.status(200).json({
      message: "token refreshed successfully",
      token,
      refreshToken: newRefresh.refreshToken,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "an error occurred while refreshing token" });
  }
};

module.exports = {
  signupAttendee: signup("attendee"),
  signupOrganizer: signup("organizer"),
  signupAdmin: signup("admin"),
  loginAttendee: login("attendee"),
  loginOrganizer: login("organizer"),
  loginAdmin: login("admin"),
  refreshTokenHandler,
};
