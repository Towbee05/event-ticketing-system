const express = require("express");
const { protect } = require("../../middleware/auth.middleware");
const { restrictTo } = require("../../middleware/role.middleware");
const controller = require("./ticket.controller");
const issuanceController = require("./issuance.controller");
const { validateCreate, validateUpdate, validateIdParam } = require("./ticket.validation");

const router = express.Router();

// --- Issued tickets (the actual seats with QR codes) ---------------------
// These come BEFORE `/:id` so they don't get swallowed by the wildcard.

// Attendee: list my issued tickets.
router.get("/mine", protect, issuanceController.mine);

// Organizer/admin: validate a ticket by code (used at the gate).
router.post(
  "/validate",
  protect,
  restrictTo("organizer", "admin"),
  issuanceController.validate,
);

// Look up an issued ticket by code. organizer/admin to avoid leaking holder info.
router.get(
  "/issued/:code",
  protect,
  restrictTo("organizer", "admin"),
  issuanceController.lookup,
);

// --- Ticket TYPES (e.g. early-bird/regular/VIP for an event) -------------
// Public reads — attendees browse tickets before authenticating.
router.get("/", controller.list);
router.get("/event/:eventId", validateIdParam("eventId"), controller.listForEvent);
router.get("/:id", validateIdParam("id"), controller.getOne);
router.get("/:id/availability", validateIdParam("id"), controller.availability);

// Mutations require organizer or admin.
router.post("/", protect, restrictTo("organizer", "admin"), validateCreate, controller.create);
router.patch(
  "/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam("id"),
  validateUpdate,
  controller.update,
);
router.delete(
  "/:id",
  protect,
  restrictTo("organizer", "admin"),
  validateIdParam("id"),
  controller.remove,
);

module.exports = router;
