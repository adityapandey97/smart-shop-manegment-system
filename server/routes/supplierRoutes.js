const express = require("express");
const router = express.Router();
const { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierComparison } = require("../controllers/supplierController");
const { protect, setOwnerFilter, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.get("/compare", protect, setOwnerFilter, getSupplierComparison);
router.route("/").get(protect, setOwnerFilter, getSuppliers).post(protect, setOwnerFilter, managerOrOwner, createSupplier);
router.route("/:id").put(protect, setOwnerFilter, managerOrOwner, updateSupplier).delete(protect, setOwnerFilter, ownerOnly, deleteSupplier);

module.exports = router;
