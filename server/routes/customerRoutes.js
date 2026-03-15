const express = require("express");
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, getCustomerLedger } = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, getCustomers).post(protect, createCustomer);
router.put("/:id", protect, updateCustomer);
router.get("/:id/ledger", protect, getCustomerLedger);

module.exports = router;
