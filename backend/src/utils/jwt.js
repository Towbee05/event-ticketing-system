const jwt = require("jsonwebtoken");

const DEFAULT_EXPIRES_IN = "7d";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "JWT_SECRET is not set (or is shorter than 16 chars). Add a strong value to backend/.env.",
    );
  }
  return secret;
}

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    getSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

module.exports = { signToken, verifyToken };
