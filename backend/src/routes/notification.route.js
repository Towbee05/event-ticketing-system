const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const controller = require("../controllers/notification.controller");
const { validateIdParam } = require("../validations/notification.validation");

const router = express.Router();

router.use(protect);

router.get("/", controller.list);
router.patch("/mark-all-read", controller.markAllRead);
router.patch("/:id/read", validateIdParam, controller.markRead);

module.exports = router;
