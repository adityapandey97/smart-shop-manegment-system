const express = require("express");
const router = express.Router();
const { getCustomers, createCustomer, updateCustomer, getCustomerLedger } = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");

router.route("/").get(protect, setOwnerFilter, getCustomers).post(protect, setOwnerFilter, createCustomer);
router.put("/:id", protect, setOwnerFilter, updateCustomer);
router.get("/:id/ledger", protect, setOwnerFilter, getCustomerLedger);

module.exports = router;
