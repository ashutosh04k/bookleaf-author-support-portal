const Book = require("../models/Book");

/**
 * @route GET /api/books/my-books
 * @desc Get books belonging to the authenticated author
 */
const getMyBooks = async (req, res, next) => {
  try {
    const books = await Book.find({ author: req.user.id }).sort({ createdAt: -1 });

    // Financial calculations summary for author
    const totalEarned = books.reduce((sum, b) => sum + (b.royaltyEarned || 0), 0);
    const totalPaid = books.reduce((sum, b) => sum + (b.royaltyPaid || 0), 0);
    const totalPending = books.reduce((sum, b) => sum + (b.royaltyPending || 0), 0);
    const totalCopies = books.reduce((sum, b) => sum + (b.copiesSold || 0), 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalBooks: books.length,
        totalCopiesSold: totalCopies,
        totalRoyaltyEarned: totalEarned,
        totalRoyaltyPaid: totalPaid,
        totalRoyaltyPending: totalPending,
        minimumPayoutThreshold: 1000,
        eligibleForPayout: totalPending >= 1000
      },
      books
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/books
 * @desc Admin list of all books in catalog
 */
const getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.find().populate("author", "name email").sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: books.length,
      books
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/books/:id
 * @desc Get single book details
 */
const getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id).populate("author", "name email");
    if (!book) {
      return res.status(404).json({ success: false, error: "Book not found" });
    }

    // Role-based access check
    if (req.user.role === "author" && book.author._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied to this book record" });
    }

    return res.status(200).json({
      success: true,
      book
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyBooks,
  getAllBooks,
  getBookById
};
