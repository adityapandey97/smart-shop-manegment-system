const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/paymentController");
const { protect, setOwnerFilter } = require("../middleware/authMiddleware");

router.post("/create-order", protect, setOwnerFilter, createOrder);
router.post("/verify", protect, setOwnerFilter, verifyPayment);

module.exports = router;
