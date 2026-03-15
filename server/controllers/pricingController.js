// ============================================
//   Pricing Controller
//   Dynamic price suggestions and price history
// ============================================

const { PriceHistory } = require("../models/OtherModels");
const Product = require("../models/Product");

// ---- Get Price History for a Product ----
// GET /api/pricing/history/:productId
const getPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find({ productId: req.params.productId })
      .populate("changedBy", "name")
      .sort({ changeDate: -1 });
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Suggested Selling Price ----
// POST /api/pricing/suggest
// Calculate what selling price maintains the desired profit margin
const getSuggestedPrice = async (req, res) => {
  try {
    const { productId, newBuyingPrice, targetMargin } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const margin = targetMargin || 20; // Default 20% margin

    // Formula: Suggested Price = New Buying Price × (1 + margin/100)
    const suggestedPrice = newBuyingPrice * (1 + margin / 100);
    const priceDiff = newBuyingPrice - product.buyingPrice;
    const profitImpact = product.sellingPrice - newBuyingPrice;

    res.json({
      success: true,
      data: {
        currentBuyingPrice: product.buyingPrice,
        newBuyingPrice,
        currentSellingPrice: product.sellingPrice,
        suggestedSellingPrice: Math.ceil(suggestedPrice),
        targetMargin: margin,
        priceDifference: priceDiff,
        currentProfitAtNewCost: profitImpact,
        isLossMaking: profitImpact < 0,
        message:
          profitImpact < 0
            ? `⚠️ Warning! Current selling price ₹${product.sellingPrice} is LESS than new cost ₹${newBuyingPrice}. You are selling at a LOSS!`
            : `Profit per unit at current price: ₹${profitImpact.toFixed(2)}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Apply Suggested Price to Product ----
// PUT /api/pricing/apply/:productId
const applyNewPrice = async (req, res) => {
  try {
    const { newSellingPrice, newBuyingPrice } = req.body;
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    // Update product with new prices
    await Product.findByIdAndUpdate(req.params.productId, {
      sellingPrice: newSellingPrice,
      ...(newBuyingPrice && { buyingPrice: newBuyingPrice }),
    });

    res.json({ success: true, message: "Prices updated successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get All Recent Price Alerts ----
// GET /api/pricing/alerts
const getPriceAlerts = async (req, res) => {
  try {
    const alerts = await PriceHistory.find()
      .populate("productId", "productName category sellingPrice")
      .populate("changedBy", "name")
      .sort({ changeDate: -1 })
      .limit(20);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPriceHistory, getSuggestedPrice, applyNewPrice, getPriceAlerts };
