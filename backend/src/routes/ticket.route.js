const express = require("express");
const { protect, attachUser } = require("../middlewares/auth.middleware");
const { restrictTo } = require("../middlewares/role.middleware");
const controller = require("../controllers/ticket.controller");
const issuanceController = require("../controllers/issuance.controller");
const { validateCreate, validateUpdate, validateIdParam } = require("../validations/ticket.validation");

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
// attachUser populates req.user when a Bearer token is sent so the service
// can show drafts to the organizer who owns the event. Anon users only see
// tickets for published events. The bare list is admin-only.

router.get("/", protect, restrictTo("admin"), controller.list);
router.get("/event/:eventId", attachUser, validateIdParam("eventId"), controller.listForEvent);
router.get("/:id", attachUser, validateIdParam("id"), controller.getOne);
router.get("/:id/availability", attachUser, validateIdParam("id"), controller.availability);

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
