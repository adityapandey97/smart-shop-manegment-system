const express = require("express");
const router = express.Router();
const { createPurchase, getPurchases } = require("../controllers/purchaseController");
const { protect, managerOrOwner } = require("../middleware/authMiddleware");

router.route("/").get(protect, getPurchases).post(protect, managerOrOwner, createPurchase);

module.exports = router;
