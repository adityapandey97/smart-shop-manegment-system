// ============================================
//   Auth Controller
//   Handles register, login, profile
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ---- Helper: Generate JWT Token ----
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },        // Payload: what to store in token
    process.env.JWT_SECRET, // Secret key for signing
    { expiresIn: "30d" }   // Token expires in 30 days
  );
};

// ---- Register New User ----
// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    // Create the new user (password gets encrypted automatically by User model)
    const user = await User.create({ name, email, password, role: role || "staff", phone });

    // Send back user data + token
    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Login User ----
// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // Check if user exists and password matches
    if (user && user.isActive && (await user.matchPassword(password))) {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();

      res.json({
        success: true,
        message: "Logged in successfully!",
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401).json({ success: false, message: "Incorrect email or password." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Current User Profile ----
// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Update Profile ----
// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;
      user.avatar = req.body.avatar || user.avatar;

      // Only update password if user provided a new one
      if (req.body.password) {
        user.password = req.body.password; // Will be re-hashed by pre-save hook
      }

      const updatedUser = await user.save();

      res.json({
        success: true,
        message: "Profile updated!",
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          token: generateToken(updatedUser._id),
        },
      });
    } else {
      res.status(404).json({ success: false, message: "User not found." });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get All Users (owner only) ----
// GET /api/auth/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser, getProfile, updateProfile, getAllUsers };
