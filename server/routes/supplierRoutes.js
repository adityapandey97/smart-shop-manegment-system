const express = require("express");
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierComparison } = require("../controllers/supplierController");
const { protect, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.get("/compare", protect, getSupplierComparison);
router.route("/").get(protect, getSuppliers).post(protect, managerOrOwner, createSupplier);
router.route("/:id").put(protect, managerOrOwner, updateSupplier).delete(protect, ownerOnly, deleteSupplier);

module.exports = router;
