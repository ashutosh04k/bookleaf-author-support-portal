const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: String,
      trim: true,
      default: ""
    },
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
      default: "Published & Live"
    },
    productionStage: {
      type: String,
      default: "Published & Live"
    },
    mrp: {
      type: Number,
      default: 0
    },
    authorRoyaltyPerCopy: {
      type: Number,
      default: 0
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
    lastRoyaltyPayoutDate: {
      type: Date,
      default: null
    },
    printPartner: {
      type: String,
      default: "In-House"
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
