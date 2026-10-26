const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      trim: true
    },
    genre: {
      type: String,
      default: "General Fiction",
      trim: true
    },
    publicationDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["Published", "In Production", "Under Review", "Archived"],
      default: "In Production"
    },
    productionStage: {
      type: String,
      enum: [
        "Manuscript Received",
        "Editing",
        "Cover Design",
        "Typesetting",
        "Proofreading",
        "ISBN Assignment",
        "Printing",
        "Distribution Setup",
        "Published & Live"
      ],
      default: "Manuscript Received"
    },
    mrp: {
      type: Number,
      required: true,
      min: 0
    },
    copiesSold: {
      type: Number,
      default: 0,
      min: 0
    },
    royaltyEarned: {
      type: Number,
      default: 0,
      min: 0
    },
    royaltyPaid: {
      type: Number,
      default: 0,
      min: 0
    },
    royaltyPending: {
      type: Number,
      default: 0,
      min: 0
    },
    platforms: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Book", bookSchema);
