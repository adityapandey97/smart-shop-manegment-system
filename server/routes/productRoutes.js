const express = require("express");
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts, getDeadStockProducts, predictProductDemand } = require("../controllers/productController");
const { protect, setOwnerFilter, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.get("/low-stock", protect, setOwnerFilter, getLowStockProducts);
router.get("/dead-stock", protect, setOwnerFilter, getDeadStockProducts);
router.get("/:id/predict", protect, setOwnerFilter, predictProductDemand);
router.route("/").get(protect, setOwnerFilter, getProducts).post(protect, setOwnerFilter, managerOrOwner, createProduct);
router.route("/:id").get(protect, setOwnerFilter, getProductById).put(protect, setOwnerFilter, managerOrOwner, updateProduct).delete(protect, setOwnerFilter, ownerOnly, deleteProduct);

module.exports = router;
