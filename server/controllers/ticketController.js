const Ticket = require("../models/Ticket");
const Message = require("../models/Message");
const Book = require("../models/Book");
const User = require("../models/User");
const { classifyAndPrioritizeTicket, generateDraftResponse } = require("../services/aiService");
const { emitNewTicket, emitNewMessage, emitTicketUpdated } = require("../services/socketService");

/**
 * Generate sequential-style ticket code e.g. BL-1025
 */
const generateTicketNumber = async () => {
  const count = await Ticket.countDocuments();
  const nextNum = 1000 + count + 1;
  return `BL-${nextNum}`;
};

/**
 * @route POST /api/tickets
 * @desc Author submits a support query
 */
const createTicket = async (req, res, next) => {
  try {
    const { bookId, subject, description, attachments } = req.body;

    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        error: "Subject and detailed description are required."
      });
    }

    let book = null;
    if (bookId && bookId !== "general") {
      book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ success: false, error: "Referenced book not found" });
      }
      if (req.user.role === "author" && book.author.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: "Referenced book does not belong to you" });
      }
    }

    const ticketNumber = await generateTicketNumber();

    // 1. AI Single-Call Classification and Priority Scoring
    const classification = await classifyAndPrioritizeTicket({
      subject,
      description,
      bookTitle: book ? book.title : null,
      authorName: req.user.name
    });

    // 2. Instantiate Ticket
    const ticket = new Ticket({
      ticketNumber,
      author: req.user.id,
      book: book ? book._id : null,
      subject,
      description,
      category: classification.suggestedCategory,
      priority: classification.suggestedPriority,
      status: "Open",
      attachments: Array.isArray(attachments) ? attachments : [],
      aiClassification: {
        suggestedCategory: classification.suggestedCategory,
        suggestedPriority: classification.suggestedPriority,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        processedAt: new Date()
      }
    });

    // 3. AI Targeted Draft Generation using relevant Knowledge Base section
    const draft = await generateDraftResponse({
      ticket,
      author: req.user,
      book
    });

    ticket.aiDraft = {
      content: draft.content,
      relevantKbTopic: draft.relevantKbTopic,
      model: draft.model,
      generatedAt: draft.generatedAt
    };

    await ticket.save();

    // 4. Save the initial author message to the Message timeline
    const initialMessage = await Message.create({
      ticket: ticket._id,
      sender: req.user.id,
      role: "author",
      content: description,
      attachments: ticket.attachments
    });

    // Populate for socket broadcast and client return
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate("author", "name email designation bankDetails")
      .populate("book", "title isbn mrp copiesSold royaltyEarned royaltyPending status productionStage");

    // Real-time broadcast to admin ops queue and author
    emitNewTicket(populatedTicket);

    return res.status(201).json({
      success: true,
      ticket: populatedTicket,
      initialMessage
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/tickets/my-tickets
 * @desc Get all tickets for current author
 */
const getMyTickets = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { author: req.user.id };

    if (status && status !== "All") {
      filter.status = status;
    }

    const tickets = await Ticket.find(filter)
      .populate("book", "title isbn status productionStage")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

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
 * @route GET /api/tickets/:id
 * @desc Get ticket detail with full message thread (Role-aware)
 */
const getTicketById = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate("author", "name email designation bankDetails")
      .populate("book", "title isbn mrp copiesSold royaltyEarned royaltyPaid royaltyPending status productionStage platforms")
      .populate("assignedTo", "name email designation");

    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    // Role check: author can only see their own ticket
    if (req.user.role === "author" && ticket.author._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied to this ticket" });
    }

    // Fetch conversation messages
    const messages = await Message.find({ ticket: ticket._id })
      .populate("sender", "name email role designation")
      .sort({ createdAt: 1 });

    // Authors NEVER receive internal notes or AI draft internal prompt metadata
    let internalNotes = [];
    if (req.user.role === "admin") {
      const InternalNote = require("../models/InternalNote");
      internalNotes = await InternalNote.find({ ticket: ticket._id })
        .populate("author", "name email designation")
        .sort({ createdAt: 1 });
    }

    // Sanitize ticket for author: hide aiDraft and internal aiClassification details
    let responseTicket = ticket.toObject();
    if (req.user.role === "author") {
      delete responseTicket.aiDraft;
    }

    return res.status(200).json({
      success: true,
      ticket: responseTicket,
      messages,
      internalNotes: req.user.role === "admin" ? internalNotes : undefined
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route POST /api/tickets/:id/messages
 * @desc Add a message / reply to ticket (Author or Admin)
 */
const addMessage = async (req, res, next) => {
  try {
    const { content, attachments } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: "Message content cannot be empty" });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Ticket not found" });
    }

    // Permission check
    if (req.user.role === "author" && ticket.author.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "You cannot post messages to this ticket" });
    }

    // If author responds to a Resolved/Closed ticket, reopen it automatically
    if (req.user.role === "author" && (ticket.status === "Resolved" || ticket.status === "Closed")) {
      ticket.status = "In Progress";
      await ticket.save();
      emitTicketUpdated(ticket);
    }

    // If admin replies and ticket was Open, transition to In Progress
    if (req.user.role === "admin" && ticket.status === "Open") {
      ticket.status = "In Progress";
      await ticket.save();
      emitTicketUpdated(ticket);
    }

    const message = await Message.create({
      ticket: ticket._id,
      sender: req.user.id,
      role: req.user.role,
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : []
    });

    const populatedMessage = await Message.findById(message._id).populate("sender", "name email role designation");

    // Real-time broadcast
    emitNewMessage(ticket._id.toString(), populatedMessage);

    return res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTicket,
  getMyTickets,
  getTicketById,
  addMessage
};
