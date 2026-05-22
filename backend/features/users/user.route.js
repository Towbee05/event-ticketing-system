const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const { restrictTo } = require("../../middleware/role.middleware");
const controller = require("./user.controller");
const { validateUpdateMe, validateUpdateRole, validateIdParam } = require("./user.validation");

const router = express.Router();

router.use(protect);

router.patch("/me", validateUpdateMe, controller.updateMe);

router.use(restrictTo("admin"));
router.get("/", controller.list);
router.patch("/:id/role", validateIdParam("id"), validateUpdateRole, controller.updateRole);
router.delete("/:id", validateIdParam("id"), controller.remove);

module.exports = router;
