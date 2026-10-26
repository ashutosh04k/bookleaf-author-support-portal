const express = require("express");
const router = express.Router();
const { getMyBooks, getAllBooks, getBookById } = require("../controllers/bookController");
const { protect, authorize } = require("../middleware/auth");

router.get("/my-books", protect, authorize("author"), getMyBooks);
router.get("/", protect, authorize("admin"), getAllBooks);
router.get("/:id", protect, getBookById);

module.exports = router;
