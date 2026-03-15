const express = require("express");
const router = express.Router();
const { getPriceHistory, getSuggestedPrice, applyNewPrice, getPriceAlerts } = require("../controllers/pricingController");
const { protect, managerOrOwner } = require("../middleware/authMiddleware");

router.get("/alerts", protect, getPriceAlerts);
router.get("/history/:productId", protect, getPriceHistory);
router.post("/suggest", protect, getSuggestedPrice);
router.put("/apply/:productId", protect, managerOrOwner, applyNewPrice);

module.exports = router;
