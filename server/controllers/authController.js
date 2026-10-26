const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { JWT_SECRET } = require("../middleware/auth");

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: "7d" });
};

/**
 * @route POST /api/auth/login
 * @desc Authenticate user and return token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Please provide both email and password"
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password"
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        bankDetails: user.bankDetails
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/auth/me
 * @desc Get currently authenticated user details
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    return res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route GET /api/auth/demo-users
 * @desc Return pre-seeded sample users for effortless evaluation
 */
const getDemoUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("name email role designation").sort({ role: 1, name: 1 });
    return res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getMe,
  getDemoUsers
};
