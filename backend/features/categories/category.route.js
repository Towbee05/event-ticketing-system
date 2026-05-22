const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const { restrictTo } = require("../../middleware/role.middleware");
const controller = require("./category.controller");
const { validateUpsert, validateIdParam } = require("./category.validation");

const router = express.Router();

// Public reads.
router.get("/", controller.list);
router.get("/:id", validateIdParam, controller.getOne);

// Admin-only writes.
router.use(protect, restrictTo("admin"));
router.post("/", validateUpsert, controller.create);
router.put("/:id", validateIdParam, validateUpsert, controller.update);
router.delete("/:id", validateIdParam, controller.remove);

module.exports = router;
