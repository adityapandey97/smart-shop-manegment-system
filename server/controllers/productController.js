// ============================================
//   Product Controller
//   Handles all product CRUD operations
// ============================================

const Product = require("../models/Product");

// ---- Get All Products ----
// GET /api/products
const getProducts = async (req, res) => {
  try {
    // Allow filtering by category or search by name
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.productName = { $regex: req.query.search, $options: "i" }; // Case-insensitive search
    }
    if (req.query.lowStock === "true") {
      filter.$expr = { $lte: ["$stockQuantity", "$minStockLevel"] };
    }

    const products = await Product.find(filter)
      .populate("supplierId", "supplierName phone") // Get supplier name too
      .sort({ createdAt: -1 }); // Newest first

    // Add computed fields for low stock and dead stock
    const productsWithFlags = products.map((p) => {
      const obj = p.toJSON();
      obj.isLowStock = p.stockQuantity <= p.minStockLevel;
      obj.daysUntilStockOut =
        p.avgDailySales > 0 ? Math.floor(p.stockQuantity / p.avgDailySales) : null;
      return obj;
    });

    res.json({ success: true, count: products.length, data: productsWithFlags });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Single Product ----
// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("supplierId");
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Add New Product ----
// POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, message: "Product added successfully!", data: product });
  } catch (error) {
    // Handle duplicate SKU error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "SKU already exists. Use a different code." });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Update Product ----
// PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return updated doc, run schema validations
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product updated!", data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Delete Product (soft delete - just mark as inactive) ----
// DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }
    res.json({ success: true, message: "Product removed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Low Stock Products ----
// GET /api/products/low-stock
// BUG FIX: Replaced $expr query (inconsistent across MongoDB versions)
// with JS-level filtering after fetch — works on all versions
const getLowStockProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).populate("supplierId", "supplierName phone");

    // Filter low stock products in JS
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel);

    res.json({ success: true, count: lowStockProducts.length, data: lowStockProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Dead Stock Products ----
// GET /api/products/dead-stock
const getDeadStockProducts = async (req, res) => {
  try {
    // Dead stock: has stock but no sale in last 45 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 45);

    const products = await Product.find({
      isActive: true,
      stockQuantity: { $gt: 0 },
      $or: [
        { lastSoldDate: { $lt: cutoffDate } }, // Not sold in 45 days
        { lastSoldDate: null },                  // Never sold at all
      ],
    });

    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getLowStockProducts,
  getDeadStockProducts,
};
