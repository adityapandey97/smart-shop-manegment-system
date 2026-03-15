const express = require("express");
const router = express.Router();
const { createPurchase, getPurchases } = require("../controllers/purchaseController");
const { protect, setOwnerFilter, managerOrOwner } = require("../middleware/authMiddleware");

router.route("/").get(protect, setOwnerFilter, getPurchases).post(protect, setOwnerFilter, managerOrOwner, createPurchase);

module.exports = router;
