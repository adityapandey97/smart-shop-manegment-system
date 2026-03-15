const express = require("express");
const router = express.Router();
const { getDashboard, getProfitReport } = require("../controllers/reportController");
const { protect, managerOrOwner } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, getDashboard);
router.get("/profit", protect, managerOrOwner, getProfitReport);

module.exports = router;
