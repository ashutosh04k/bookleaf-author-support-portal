const mongoose = require("mongoose");

const internalNoteSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    content: {
      type: String,
      required: [true, "Note content is required"],
      trim: true
    }
  },
  {
    timestamps: true
  }
);

internalNoteSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("InternalNote", internalNoteSchema);
