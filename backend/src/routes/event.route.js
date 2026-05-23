const express = require("express");
const { protect, attachUser } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const controller = require("../controllers/event.controller");
const { validateBody, validateIdParam } = require("../validations/event.validation");

const router = express.Router();

// Reads: attachUser is optional auth so organizers see their drafts on /
router.get("/", attachUser, controller.list);
router.get("/:id", validateIdParam, controller.getOne);

// Writes: organizer or admin only. organizer field is set server-side from the JWT.
router.post(
  "/",
  protect,
  restrictTo("organizer", "admin"),
  validateBody(true),
  controller.create,
);

router.put(
  "/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam,
  validateBody(false),
  controller.update,
);

router.delete(
  "/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam,
  controller.remove,
);

router.put(
  "/publish/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam,
  controller.publish,
);

router.put(
  "/cancel/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam,
  controller.cancel,
);

module.exports = router;
