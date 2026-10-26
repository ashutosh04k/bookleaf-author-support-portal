const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      default: null
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true
    },
    category: {
      type: String,
      enum: [
        "Royalty & Payments",
        "ISBN & Metadata Issues",
        "Printing & Quality",
        "Distribution & Availability",
        "Book Status & Production Updates",
        "General Inquiry"
      ],
      default: "General Inquiry"
    },
    priority: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low"],
      default: "Medium"
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open"
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        size: { type: Number }
      }
    ],
    aiClassification: {
      suggestedCategory: { type: String },
      suggestedPriority: { type: String },
      confidence: { type: Number },
      reasoning: { type: String },
      isOverridden: { type: Boolean, default: false },
      processedAt: { type: Date }
    },
    aiDraft: {
      content: { type: String, default: "" },
      relevantKbTopic: { type: String, default: "" },
      model: { type: String, default: "rule-engine" },
      generatedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

// Indexes for query performance & sorting
ticketSchema.index({ author: 1, createdAt: -1 });
ticketSchema.index({ status: 1, priority: 1, createdAt: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);
