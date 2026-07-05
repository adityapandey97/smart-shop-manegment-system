const express = require("express");
const router = express.Router();
const { getDashboard, getProfitReport, getAIInsights, chatAssistant } = require("../controllers/reportController");
const { protect, setOwnerFilter, managerOrOwner } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, setOwnerFilter, getDashboard);
router.get("/profit", protect, setOwnerFilter, managerOrOwner, getProfitReport);
router.get("/ai-insights", protect, setOwnerFilter, getAIInsights);
router.post("/chat-assistant", protect, setOwnerFilter, chatAssistant);

module.exports = router;
