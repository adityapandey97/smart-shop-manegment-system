const express = require("express");
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, getLowStockProducts, getDeadStockProducts } = require("../controllers/productController");
const { protect, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.get("/low-stock", protect, getLowStockProducts);
router.get("/dead-stock", protect, getDeadStockProducts);
router.route("/").get(protect, getProducts).post(protect, managerOrOwner, createProduct);
router.route("/:id").get(protect, getProductById).put(protect, managerOrOwner, updateProduct).delete(protect, ownerOnly, deleteProduct);

module.exports = router;
