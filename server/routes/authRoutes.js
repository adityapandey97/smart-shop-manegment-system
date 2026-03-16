const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getProfile, updateProfile, getAllUsers } = require("../controllers/authController");
const { protect, setOwnerFilter, ownerOnly } = require("../middleware/authMiddleware");

// Public routes — NO setOwnerFilter (no req.user exists yet)
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes — setOwnerFilter runs after protect sets req.user
router.get("/profile", protect, setOwnerFilter, getProfile);
router.put("/profile", protect, setOwnerFilter, updateProfile);
router.get("/users", protect, setOwnerFilter, ownerOnly, getAllUsers);

module.exports = router;
