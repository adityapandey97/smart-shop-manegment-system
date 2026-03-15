const express = require("express");
const router = express.Router();
const { createSale, getSales, getSaleById } = require("../controllers/salesController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getSales).post(protect, createSale);
router.get("/:id", protect, getSaleById);

module.exports = router;
