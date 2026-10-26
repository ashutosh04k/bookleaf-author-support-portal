const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    role: {
      type: String,
      enum: ["author", "admin", "system"],
      required: true
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        size: { type: Number }
      }
    ]
  },
  {
    timestamps: true
  }
);

messageSchema.index({ ticket: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
