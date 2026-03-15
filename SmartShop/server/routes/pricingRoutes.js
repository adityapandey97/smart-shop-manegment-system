const express = require("express");
const router = express.Router();
const { getPriceHistory, getSuggestedPrice, applyNewPrice, getPriceAlerts } = require("../controllers/pricingController");
const { protect, setOwnerFilter, managerOrOwner } = require("../middleware/authMiddleware");

router.get("/alerts", protect, setOwnerFilter, getPriceAlerts);
router.get("/history/:productId", protect, setOwnerFilter, getPriceHistory);
router.post("/suggest", protect, setOwnerFilter, getSuggestedPrice);
router.put("/apply/:productId", protect, setOwnerFilter, managerOrOwner, applyNewPrice);

module.exports = router;
