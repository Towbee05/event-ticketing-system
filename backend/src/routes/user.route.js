const express = require("express");
const { protect } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const controller = require("../controllers/user.controller");
const { validateUpdateMe, validateUpdateRole, validateIdParam } = require("../validations/user.validation");

const router = express.Router();

router.use(protect);

router.patch("/me", validateUpdateMe, controller.updateMe);

router.use(restrictTo("admin"));
router.get("/", controller.list);
router.patch("/:id/role", validateIdParam("id"), validateUpdateRole, controller.updateRole);
router.delete("/:id", validateIdParam("id"), controller.remove);

module.exports = router;
