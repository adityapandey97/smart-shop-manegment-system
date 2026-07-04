const express = require("express");
const router = express.Router();
const { recordPayment, getPaymentHistory, getAllPendingUdhars, sendReminder } = require("../controllers/udharController");
const { protect, setOwnerFilter } = require("../middleware/authMiddleware");

router.post("/pay", protect, setOwnerFilter, recordPayment);
router.post("/reminder", protect, setOwnerFilter, sendReminder);
router.get("/pending", protect, setOwnerFilter, getAllPendingUdhars);
router.get("/history/:customerId", protect, setOwnerFilter, getPaymentHistory);

module.exports = router;
