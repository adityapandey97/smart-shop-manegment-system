// ============================================
//   Pricing Controller — with owner isolation
// ============================================
const { PriceHistory } = require("../models/OtherModels");
const Product = require("../models/Product");

const getPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.find({ productId: req.params.productId, owner: req.ownerId })
      .populate("changedBy", "name").sort({ changeDate: -1 });
    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSuggestedPrice = async (req, res) => {
  try {
    const { productId, newBuyingPrice, targetMargin } = req.body;
    const product = await Product.findOne({ _id: productId, owner: req.ownerId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    const margin = targetMargin || 20;
    const suggestedPrice = newBuyingPrice * (1 + margin / 100);
    const profitImpact = product.sellingPrice - newBuyingPrice;
    res.json({
      success: true,
      data: {
        currentBuyingPrice: product.buyingPrice, newBuyingPrice,
        currentSellingPrice: product.sellingPrice,
        suggestedSellingPrice: Math.ceil(suggestedPrice),
        targetMargin: margin, profitImpact,
        isLossMaking: profitImpact < 0,
        message: profitImpact < 0
          ? `⚠️ Current selling price ₹${product.sellingPrice} is less than new cost ₹${newBuyingPrice}. Selling at a LOSS!`
          : `Profit per unit: ₹${profitImpact.toFixed(2)}`,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const applyNewPrice = async (req, res) => {
  try {
    const { newSellingPrice, newBuyingPrice } = req.body;
    const product = await Product.findOneAndUpdate(
      { _id: req.params.productId, owner: req.ownerId },
      { sellingPrice: newSellingPrice, ...(newBuyingPrice && { buyingPrice: newBuyingPrice }) },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    res.json({ success: true, message: "Prices updated!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPriceAlerts = async (req, res) => {
  try {
    const alerts = await PriceHistory.find({ owner: req.ownerId })
      .populate("productId", "productName category sellingPrice")
      .populate("changedBy", "name")
      .sort({ changeDate: -1 }).limit(20);
    res.json({ success: true, data: alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPriceHistory, getSuggestedPrice, applyNewPrice, getPriceAlerts };
