// ============================================
//   Auth Controller
//   Handles register, login, profile
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");

// ---- Helper: Generate JWT Token ----
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// ---- Helper: Generate Unique 5-digit Store ID ----
const generateStoreId = async () => {
  let isUnique = false;
  let code = "";
  while (!isUnique) {
    code = Math.floor(10000 + Math.random() * 90000).toString();
    const existing = await User.findOne({ role: "owner", storeId: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

// ---- Register New User ----
// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, storeName, storeId } = req.body;

    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }

    // Determine role and shopOwnerId
    const userRole = role || "staff";
    let shopOwnerId = null;
    let finalStoreId = "";
    let finalStoreName = "";
    let isActive = true;

    if (userRole === "owner") {
      if (!storeName) {
        return res.status(400).json({ success: false, message: "Store name is required for owners." });
      }
      finalStoreName = storeName;
      finalStoreId = await generateStoreId();
      isActive = true;
    } else {
      if (!storeId) {
        return res.status(400).json({ success: false, message: "Store ID is required for staff/managers." });
      }
      // Look up owner with this storeId
      const owner = await User.findOne({ role: "owner", storeId });
      if (!owner) {
        return res.status(404).json({ success: false, message: `Store with ID ${storeId} not found. Please verify the ID.` });
      }
      shopOwnerId = owner._id;
      finalStoreId = owner.storeId;
      finalStoreName = owner.storeName;
      isActive = false; // Must be approved by owner!
    }

    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
      phone,
      shopOwnerId,
      storeId: finalStoreId,
      storeName: finalStoreName,
      isActive
    });

    if (userRole !== "owner") {
      // Create an admission request notification for the owner
      await Notification.create({
        ownerId: shopOwnerId,
        title: "New Staff Admission Request",
        message: `${name} wants to join your store '${finalStoreName}' as ${userRole}.`,
        type: "staff_request",
        staffId: user._id,
      });
    }

    res.status(201).json({
      success: true,
      message: userRole === "owner" 
        ? `Account created! Store unique ID is ${finalStoreId}.`
        : "Registration request sent to store owner. Please wait for approval.",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        storeId: user.storeId,
        storeName: user.storeName,
        isActive: user.isActive,
        token: userRole === "owner" ? generateToken(user._id) : undefined, // Only login owner immediately
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

    const user = await User.findOne({ email });

    // BUG FIX: Also check isActive — disabled accounts must not be allowed to login
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account not found or has been disabled." });
    }

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: "Incorrect email or password." });
    }

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
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Current User Profile ----
// GET /api/auth/profile
const getProfile = async (req, res) => {
  try {
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

      if (req.body.password) {
        user.password = req.body.password;
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
    // Owners can only see users in their shop: themselves (if owner) and staff/managers they own
    const filter = {
      $or: [
        { role: "owner", _id: req.user._id }, // themselves if they're owner
        { shopOwnerId: req.user._id } // staff/managers they own
      ]
    };
    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Search Store (Public) ----
// GET /api/auth/search-store?query=...
const searchStore = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: "Search query is required." });
    }
    const owners = await User.find({
      role: "owner",
      storeName: { $regex: query, $options: "i" }
    }).select("storeName storeId");

    res.json({ success: true, count: owners.length, data: owners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Notifications (Protected) ----
// GET /api/auth/notifications
const getNotifications = async (req, res) => {
  try {
    // Return all notifications for the owner
    const notifications = await Notification.find({ ownerId: req.ownerId })
      .populate("staffId", "name email role phone")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Resolve Notification (Approve/Reject Staff) ----
// PUT /api/auth/notifications/:id/resolve
const resolveNotification = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const notification = await Notification.findOne({ _id: req.params.id, ownerId: req.ownerId });
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found." });
    }

    if (notification.type === "staff_request") {
      if (action === "approve") {
        await User.findByIdAndUpdate(notification.staffId, { isActive: true });
        notification.message = `Approved: ${notification.message}`;
      } else {
        await User.findByIdAndDelete(notification.staffId);
        notification.message = `Rejected and deleted: ${notification.message}`;
      }
    }

    notification.isResolved = true;
    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: `Staff request ${action === "approve" ? "approved" : "rejected"} successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  searchStore,
  getNotifications,
  resolveNotification
};
