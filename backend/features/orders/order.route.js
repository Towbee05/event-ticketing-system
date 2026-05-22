const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const { restrictTo } = require("../../middleware/role.middleware");
const controller = require("./order.controller");
const { validateCreate, validateIdParam } = require("./order.validation");

const router = express.Router();

// Every order endpoint requires authentication.
router.use(protect);

// PRD: GET /api/orders/my-orders — must be defined before /:id to avoid collision.
router.get("/my-orders", controller.myOrders);

router.get("/", restrictTo("admin"), controller.list);
router.post("/", validateCreate, controller.create);

router.get("/:id", validateIdParam("id"), controller.getOne);
router.patch("/:id/cancel", validateIdParam("id"), controller.cancel);
router.patch("/:id/complete", validateIdParam("id"), restrictTo("admin"), controller.complete);
router.delete("/:id", validateIdParam("id"), restrictTo("admin"), controller.remove);

module.exports = router;
