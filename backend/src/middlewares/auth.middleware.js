const AppError = require("../utils/AppError");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function authenticate(token) {
  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Session expired, please log in again", 401, "TOKEN_EXPIRED");
    }
    throw new AppError("Invalid authentication token", 401, "INVALID_TOKEN");
  }

  const user = await User.findById(payload.id).select("+passwordChangedAt");
  if (!user) {
    throw new AppError("The account for this token no longer exists", 401, "USER_NOT_FOUND");
  }
  if (user.passwordChangedAfter(payload.iat)) {
    throw new AppError("Password recently changed, please log in again", 401, "STALE_TOKEN");
  }

  return { id: user._id.toString(), role: user.role, email: user.email, name: user.name };
}

const protect = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
  authenticate(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(next);
};

const attachUser = (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  authenticate(token)
    .then((user) => {
      req.user = user;
      next();
    })
    .catch(() => next()); // Invalid token = treat as anonymous on optional routes.
};

module.exports = { protect, attachUser };
