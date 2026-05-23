const Notification = require("../models/Notification");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const email = require("./email.service");

// Core dispatch: stores an in-app notification AND fires an email if we can resolve one.
// Other features (orders, payments, auth) import this directly instead of HTTP-calling themselves.
async function dispatch({ userId, title, message, email: explicitEmail, emailHtml }) {
  if (!userId) return null;

  // Create the in-app notification synchronously — clients see it on next refresh.
  const notification = await Notification.create({
    user: userId,
    title,
    message,
  });

  // Resolve recipient email (callers can override).
  let to = explicitEmail;
  if (!to) {
    const user = await User.findById(userId).select("email name");
    if (user) to = user.email;
  }

  if (to) {
    // Don't await — emailing should never block the request. Log failure if any.
    Promise.resolve(
      email.send({
        to,
        subject: title,
        text: message,
        html: emailHtml,
      }),
    ).catch((err) => console.error("[notification] email send failed:", err.message));
  }

  return notification;
}

const listForUser = async (userId, { onlyUnread } = {}) => {
  const filter = { user: userId };
  if (onlyUnread) filter.isRead = false;
  return Notification.find(filter).sort({ createdAt: -1 }).limit(50);
};

const markRead = async (id, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { isRead: true },
    { new: true },
  );
  if (!notification) throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  return notification;
};

const markAllRead = (userId) =>
  Notification.updateMany({ user: userId, isRead: false }, { isRead: true });

const unreadCount = (userId) => Notification.countDocuments({ user: userId, isRead: false });

module.exports = { dispatch, listForUser, markRead, markAllRead, unreadCount };
