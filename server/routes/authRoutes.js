// ============================================
//   Auth Routes
// ============================================
const express = require("express");
const router = express.Router();
const { registerUser, loginUser, getProfile, updateProfile, getAllUsers } = require("../controllers/authController");
const { protect, ownerOnly } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.get("/users", protect, ownerOnly, getAllUsers);

module.exports = router;
