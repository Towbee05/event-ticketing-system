const catchAsync = require("../../pkg/utils/catchAsync");
const { success } = require("../../pkg/utils/response");
const service = require("./notification.service");

const list = catchAsync(async (req, res) => {
  const onlyUnread = req.query.unread === "true";
  const [items, unread] = await Promise.all([
    service.listForUser(req.user.id, { onlyUnread }),
    service.unreadCount(req.user.id),
  ]);
  success(res, { data: items, meta: { unread } });
});

const markRead = catchAsync(async (req, res) => {
  const data = await service.markRead(req.params.id, req.user.id);
  success(res, { message: "Marked read", data });
});

const markAllRead = catchAsync(async (req, res) => {
  await service.markAllRead(req.user.id);
  success(res, { message: "All notifications marked read" });
});

module.exports = { list, markRead, markAllRead };
