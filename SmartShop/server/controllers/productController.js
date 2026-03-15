// ============================================
//   Product Controller — with owner isolation
//   Every query filtered by req.ownerId
// ============================================

const Product = require("../models/Product");

const getProducts = async (req, res) => {
  try {
    const filter = { isActive: true, owner: req.ownerId };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.productName = { $regex: req.query.search, $options: "i" };
    }

    const products = await Product.find(filter)
      .populate("supplierId", "supplierName phone")
      .sort({ createdAt: -1 });

    const productsWithFlags = products.map((p) => {
      const obj = p.toJSON();
      obj.isLowStock = p.stockQuantity <= p.minStockLevel;
      obj.daysUntilStockOut = p.avgDailySales > 0
        ? Math.floor(p.stockQuantity / p.avgDailySales) : null;
      return obj;
    });

    let result = productsWithFlags;
    if (req.query.lowStock === "true") {
      result = productsWithFlags.filter((p) => p.isLowStock);
    }

    res.json({ success: true, count: result.length, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, owner: req.ownerId })
      .populate("supplierId");
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const product = await Product.create({ ...req.body, owner: req.ownerId });
    res.status(201).json({ success: true, message: "Product added!", data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "SKU already exists." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.ownerId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product updated!", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, owner: req.ownerId },
      { isActive: false },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Product removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, owner: req.ownerId })
      .populate("supplierId", "supplierName phone");
    const lowStock = products.filter((p) => p.stockQuantity <= p.minStockLevel);
    res.json({ success: true, count: lowStock.length, data: lowStock });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDeadStockProducts = async (req, res) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);
    const products = await Product.find({
      isActive: true,
      owner: req.ownerId,
      stockQuantity: { $gt: 0 },
      $or: [{ lastSoldDate: { $lt: cutoffDate } }, { lastSoldDate: null }],
    });
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getLowStockProducts, getDeadStockProducts,
};
