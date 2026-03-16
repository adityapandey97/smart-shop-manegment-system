const express = require("express");
const router = express.Router();
const { recordPayment, getPaymentHistory, getAllPendingUdhars } = require("../controllers/udharController");
const { protect, setOwnerFilter } = require("../middleware/authMiddleware");

router.post("/pay", protect, setOwnerFilter, recordPayment);
router.get("/pending", protect, setOwnerFilter, getAllPendingUdhars);
router.get("/history/:customerId", protect, setOwnerFilter, getPaymentHistory);

module.exports = router;
