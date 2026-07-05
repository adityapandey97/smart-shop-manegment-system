const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  getAllUsers,
  searchStore,
  getNotifications,
  resolveNotification
} = require("../controllers/authController");
const { protect, setOwnerFilter, ownerOnly } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/search-store", searchStore);

// Protected routes
router.get("/profile", protect, setOwnerFilter, getProfile);
router.put("/profile", protect, setOwnerFilter, updateProfile);
router.get("/users", protect, setOwnerFilter, ownerOnly, getAllUsers);

// Owner notifications / admission requests approval
router.get("/notifications", protect, setOwnerFilter, getNotifications);
router.put("/notifications/:id/resolve", protect, setOwnerFilter, ownerOnly, resolveNotification);

module.exports = router;
