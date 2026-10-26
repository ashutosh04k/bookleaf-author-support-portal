const express = require("express");
const router = express.Router();
const {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage
} = require("../controllers/ticketController");
const { protect, authorize } = require("../middleware/auth");

router.post("/", protect, authorize("author"), createTicket);
router.get("/my-tickets", protect, authorize("author"), getMyTickets);
router.get("/:id", protect, getTicketById);
router.post("/:id/messages", protect, addMessage);

module.exports = router;
