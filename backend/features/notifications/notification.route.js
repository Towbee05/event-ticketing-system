const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const controller = require("./notification.controller");
const { validateIdParam } = require("./notification.validation");

const router = express.Router();

router.use(protect);

router.get("/", controller.list);
router.patch("/mark-all-read", controller.markAllRead);
router.patch("/:id/read", validateIdParam, controller.markRead);

module.exports = router;
