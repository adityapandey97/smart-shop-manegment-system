const express = require("express");
const router = express.Router();
const { recordPayment, getPaymentHistory, getAllPendingUdhars } = require("../controllers/udharController");
const { protect } = require("../middleware/authMiddleware");

router.post("/pay", protect, recordPayment);
router.get("/pending", protect, getAllPendingUdhars);
router.get("/history/:customerId", protect, getPaymentHistory);

module.exports = router;
