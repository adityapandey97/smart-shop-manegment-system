const express = require("express");
const router = express.Router();
const { getDashboard, getProfitReport } = require("../controllers/reportController");
const { protect, setOwnerFilter, managerOrOwner } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, setOwnerFilter, getDashboard);
router.get("/profit", protect, setOwnerFilter, managerOrOwner, getProfitReport);

module.exports = router;
