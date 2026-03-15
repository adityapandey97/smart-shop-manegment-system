// ============================================
//   Authentication Middleware
//   Checks if user has a valid login token
// ============================================

const jwt = require("jsonwebtoken");
const User = require("../models/User");

// This middleware runs before any protected route
// It checks if the user is logged in
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the request header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token (remove "Bearer " prefix)
      token = req.headers.authorization.split(" ")[1];

      // Verify the token is valid and not expired
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get the user data (without password) and attach to request
      req.user = await User.findById(decoded.id).select("-password");

      next(); // Move to the next function (the actual route)
    } catch (error) {
      res.status(401).json({ success: false, message: "Invalid or expired token. Please log in again." });
    }
  }

  if (!token) {
    res.status(401).json({ success: false, message: "Not authorized. Please log in first." });
  }
};

// Middleware to check if user is an Owner (admin)
const ownerOnly = (req, res, next) => {
  if (req.user && req.user.role === "owner") {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Only owners can do this." });
  }
};

// Middleware for owner and manager both
const managerOrOwner = (req, res, next) => {
  if (req.user && (req.user.role === "owner" || req.user.role === "manager")) {
    next();
  } else {
    res.status(403).json({ success: false, message: "Access denied. Manager or Owner only." });
  }
};

module.exports = { protect, ownerOnly, managerOrOwner };
