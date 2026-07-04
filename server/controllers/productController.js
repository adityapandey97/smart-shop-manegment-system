const Product = require("../models/Product");
const Sale = require("../models/Sale");
const axios = require("axios");

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

const predictProductDemand = async (req, res) => {
  try {
    const owner = req.ownerId;
    const productId = req.params.id;
    const product = await Product.findOne({ _id: productId, owner });
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Query sales history of past 30 days for this product
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sales = await Sale.find({
      owner,
      saleDate: { $gte: thirtyDaysAgo },
      "items.productId": productId
    });

    // Extract sales data grouped by date
    const dateMap = {};
    sales.forEach(sale => {
      const dateStr = sale.saleDate.toISOString().split("T")[0];
      const item = sale.items.find(i => i.productId.toString() === productId);
      if (item) {
        dateMap[dateStr] = (dateMap[dateStr] || 0) + item.quantity;
      }
    });

    const salesHistory = Object.keys(dateMap).map(date => ({
      date,
      quantity: dateMap[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Call Python Flask AI service
    let aiData;
    try {
      const aiResponse = await axios.post("http://localhost:5001/predict-demand", {
        productId,
        productName: product.productName,
        currentStock: product.stockQuantity,
        salesHistory
      });
      aiData = aiResponse.data.data;
    } catch (err) {
      console.warn("Could not connect to Flask AI Service for demand prediction, using mock forecast.");
      // Fallback if Flask is down: generate a mock forecast in JS
      const avgDaily = salesHistory.length > 0 
        ? salesHistory.reduce((sum, s) => sum + s.quantity, 0) / salesHistory.length 
        : 0.5;
      const daysOut = avgDaily > 0 ? Math.floor(product.stockQuantity / avgDaily) : 999;
      
      const next7Days = [];
      for (let i = 1; i <= 7; i++) {
        const dStr = new Date();
        dStr.setDate(dStr.getDate() + i);
        next7Days.push({
          date: dStr.toISOString().split("T")[0],
          predicted_quantity: Math.max(0, Math.round(avgDaily * (0.8 + Math.random() * 0.4)))
        });
      }

      aiData = {
        avgDailySales: Number(avgDaily.toFixed(2)),
        predictedDailySales: Number(avgDaily.toFixed(2)),
        daysUntilStockout: daysOut,
        urgency: daysOut <= 3 ? "critical" : daysOut <= 7 ? "high" : "low",
        recommendation: daysOut <= 7 
          ? `⚠️ Stock runs out soon (${daysOut} days). Please restock.` 
          : `✅ Stock is sufficient for about ${daysOut} days.`,
        reorderQuantity: Math.round(avgDaily * 30),
        next7Days
      };
    }

    res.json({ success: true, data: aiData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getLowStockProducts, getDeadStockProducts, predictProductDemand,
};
