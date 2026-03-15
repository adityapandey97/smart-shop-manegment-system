const express = require("express");
const router = express.Router();
const { createSale, getSales, getSaleById } = require("../controllers/salesController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, setOwnerFilter, getSales).post(protect, setOwnerFilter, createSale);
router.get("/:id", protect, setOwnerFilter, getSaleById);

module.exports = router;
