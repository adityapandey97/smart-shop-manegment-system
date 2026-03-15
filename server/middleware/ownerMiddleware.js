// ============================================
//   Owner Filter Middleware
//   Automatically adds owner filter to every
//   request so users only see their own data
// ============================================

// This middleware reads req.user._id (set by protect middleware)
// and stores the shop owner ID.
//
// HOW IT WORKS:
// - Owner role: their own _id is the shopId
// - Manager/Staff role: they belong to a shop owned by someone else
//   For simplicity (single-shop system), we use the logged-in owner's _id
//   For multi-shop, you would add a shopId field to User model
//
// Usage: add req.ownerId to every query filter

const User = require("../models/User");

const setOwnerFilter = async (req, res, next) => {
  try {
    if (!req.user) return next();

    if (req.user.role === "owner") {
      // Owner sees their own data
      req.ownerId = req.user._id;
    } else {
      // Manager/Staff: find who owns this shop
      // Look for the owner who created this user
      // For now use the user's own createdBy field or fall back to self
      req.ownerId = req.user.shopOwnerId || req.user._id;
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = { setOwnerFilter };
