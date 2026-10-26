const express = require("express");
const router = express.Router();
const {
  getQueue,
  getStats,
  updateStatus,
  overrideClassification,
  assignTicket,
  addInternalNote,
  regenerateDraft,
  sendReply
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

// All routes here strictly require admin role
router.use(protect, authorize("admin"));

router.get("/queue", getQueue);
router.get("/stats", getStats);
router.patch("/tickets/:id/status", updateStatus);
router.patch("/tickets/:id/override", overrideClassification);
router.patch("/tickets/:id/assign", assignTicket);
router.post("/tickets/:id/internal-notes", addInternalNote);
router.post("/tickets/:id/regenerate-draft", regenerateDraft);
router.post("/tickets/:id/send-reply", sendReply);

module.exports = router;
