const Ticket = require("../models/Ticket");
const Message = require("../models/Message");
const InternalNote = require("../models/InternalNote");
const User = require("../models/User");
const Book = require("../models/Book");
const { generateDraftResponse } = require("../services/aiService");
const { emitTicketUpdated, emitNewMessage, emitNewInternalNote } = require("../services/socketService");

/**
 * @route GET /api/admin/queue
 * @desc Get dense ticket queue with advanced filtering & sorting
 */
const getQueue = async (req, res, next) => {
  try {
    const { status, category, priority, assignedTo, search, sortBy } = req.query;

    const filter = {};

    if (status && status !== "All") {
      filter.status = status;
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    if (priority && priority !== "All") {
      filter.priority = priority;
    }

    if (assignedTo === "me") {
      filter.assignedTo = req.user.id;
    } else if (assignedTo === "unassigned") {
      filter.assignedTo = null;
    } else if (assignedTo && assignedTo !== "All") {
      filter.assignedTo = assignedTo;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { description: regex }
      ];
    }

    // Sorting strategy: default to oldest unresolved first or by requested sort
    let sortOptions = { createdAt: 1 }; // Oldest first default for SLAs
    if (sortBy === "newest") {
      sortOptions = { createdAt: -1 };
    } else if (sortBy === "oldest") {
      sortOptions = { createdAt: 1 };
    }

    let tickets = await Ticket.find(filter)
      .populate("author", "name email designation")
      .populate("book", "title isbn mrp copiesSold royaltyPending status productionStage")
      .populate("assignedTo", "name email")
      .sort(sortOptions);

    if (sortBy === "priority") {
      const priorityOrder = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      tickets = tickets.sort((a, b) => {
        const orderA = priorityOrder[a.priority] || 99;
        const orderB = priorityOrder[b.priority] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
    }

    return res.status(200).json({
      success: true,
      count: tickets.length,
      tickets
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/admin/stats
 * @desc Header statistics ribbon for operations desk
 */
const getStats = async (req, res, next) => {
  try {
    const total = await Ticket.countDocuments();
    const openCount = await Ticket.countDocuments({ status: "Open" });
    const inProgressCount = await Ticket.countDocuments({ status: "In Progress" });
    const criticalCount = await Ticket.countDocuments({
      priority: "Critical",
      status: { $in: ["Open", "In Progress"] }
    });
    const unassignedCount = await Ticket.countDocuments({
      assignedTo: null,
      status: { $in: ["Open", "In Progress"] }
    });
    const resolvedCount = await Ticket.countDocuments({ status: { $in: ["Resolved", "Closed"] } });

    return res.status(200).json({
      success: true,
      stats: {
        total,
        open: openCount,
        inProgress: inProgressCount,
        criticalUnresolved: criticalCount,
        unassigned: unassignedCount,
        resolved: resolvedCount
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/admin/tickets/:id/status
 * @desc Change ticket status (Open, In Progress, Resolved, Closed)
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["Open", "In Progress", "Resolved", "Closed"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status value" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    ticket.status = status;
    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("author", "name email designation")
      .populate("book", "title isbn status productionStage")
      .populate("assignedTo", "name email");

    emitTicketUpdated(populated);

    return res.status(200).json({
      success: true,
      ticket: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/admin/tickets/:id/override
 * @desc Admin override for AI category or priority
 */
const overrideClassification = async (req, res, next) => {
  try {
    const { category, priority } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    let modified = false;
    if (category && category !== ticket.category) {
      ticket.category = category;
      ticket.aiClassification.isOverridden = true;
      modified = true;
    }

    if (priority && priority !== ticket.priority) {
      ticket.priority = priority;
      ticket.aiClassification.isOverridden = true;
      modified = true;
    }

    if (modified) {
      await ticket.save();
    }

    const populated = await Ticket.findById(ticket._id)
      .populate("author", "name email designation")
      .populate("book", "title isbn status productionStage")
      .populate("assignedTo", "name email");

    emitTicketUpdated(populated);

    return res.status(200).json({
      success: true,
      ticket: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route PATCH /api/admin/tickets/:id/assign
 * @desc Assign ticket to an admin or unassign
 */
const assignTicket = async (req, res, next) => {
  try {
    const { adminId } = req.body; // null to unassign, or admin user id, or 'me'
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    if (adminId === "me") {
      ticket.assignedTo = req.user.id;
    } else if (adminId === null || adminId === "unassign") {
      ticket.assignedTo = null;
    } else {
      const adminUser = await User.findOne({ _id: adminId, role: "admin" });
      if (!adminUser) {
        return res.status(400).json({ success: false, error: "Specified admin not found" });
      }
      ticket.assignedTo = adminUser._id;
    }

    await ticket.save();

    const populated = await Ticket.findById(ticket._id)
      .populate("author", "name email designation")
      .populate("book", "title isbn status productionStage")
      .populate("assignedTo", "name email");

    emitTicketUpdated(populated);

    return res.status(200).json({
      success: true,
      ticket: populated
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/admin/tickets/:id/internal-notes
 * @desc Add an internal ops note (hidden from authors)
 */
const addInternalNote = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Note content cannot be empty" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    const note = await InternalNote.create({
      ticket: ticket._id,
      author: req.user.id,
      content: content.trim()
    });

    const populatedNote = await InternalNote.findById(note._id).populate("author", "name email designation");

    // Real-time broadcast strictly to admins
    emitNewInternalNote(ticket._id.toString(), populatedNote);

    return res.status(201).json({
      success: true,
      note: populatedNote
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/admin/tickets/:id/regenerate-draft
 * @desc Regenerate AI draft response on demand
 */
const regenerateDraft = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    const author = await User.findById(ticket.author);
    const book = ticket.book ? await Book.findById(ticket.book) : null;

    const draft = await generateDraftResponse({
      ticket,
      author,
      book
    });

    ticket.aiDraft = {
      content: draft.content,
      relevantKbTopic: draft.relevantKbTopic,
      model: draft.model,
      generatedAt: draft.generatedAt
    };

    await ticket.save();

    return res.status(200).json({
      success: true,
      aiDraft: ticket.aiDraft
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/admin/tickets/:id/send-reply
 * @desc Send admin reply to author (can be edited AI draft or new message)
 */
const sendReply = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Reply content cannot be empty" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    // Auto update status to In Progress if currently Open
    if (ticket.status === "Open") {
      ticket.status = "In Progress";
    }

    // Auto assign to replying admin if currently unassigned
    if (!ticket.assignedTo) {
      ticket.assignedTo = req.user.id;
    }

    await ticket.save();

    const message = await Message.create({
      ticket: ticket._id,
      sender: req.user.id,
      role: "admin",
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email role designation");

    // Real-time broadcast
    emitNewMessage(ticket._id.toString(), populatedMessage);
    emitTicketUpdated(await Ticket.findById(ticket._id).populate("author book assignedTo"));

    return res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getQueue,
  getStats,
  updateStatus,
  overrideClassification,
  assignTicket,
  addInternalNote,
  regenerateDraft,
  sendReply
};
