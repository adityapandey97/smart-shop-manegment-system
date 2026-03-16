// ============================================
//   Purchase Controller — with owner isolation
// ============================================
const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const { PriceHistory } = require("../models/OtherModels");

const createPurchase = async (req, res) => {
  try {
    const { productId, supplierId, quantity, buyingPrice, purchaseDate, invoiceNumber, notes, paymentStatus, paidAmount } = req.body;

    // Make sure product belongs to this owner
    const product = await Product.findOne({ _id: productId, owner: req.ownerId });
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });

    const totalCost = Number(quantity) * Number(buyingPrice);

    const purchase = await Purchase.create({
      productId, supplierId, quantity, buyingPrice, totalCost,
      purchaseDate: purchaseDate || new Date(),
      invoiceNumber, notes,
      paymentStatus: paymentStatus || "paid",
      paidAmount: paidAmount || totalCost,
      enteredBy: req.user._id,
      owner: req.ownerId,
    });

    await Product.findByIdAndUpdate(productId, { $inc: { stockQuantity: Number(quantity) } });

    const oldBuyingPrice = product.buyingPrice;
    if (Number(buyingPrice) !== oldBuyingPrice) {
      const targetMargin = 20;
      const suggestedSellingPrice = Number(buyingPrice) * (1 + targetMargin / 100);
      await PriceHistory.create({
        productId, oldBuyingPrice,
        newBuyingPrice: Number(buyingPrice),
        oldSellingPrice: product.sellingPrice,
        suggestedSellingPrice: Math.ceil(suggestedSellingPrice),
        targetMargin,
        reason: "New stock purchased at different price",
        changeDate: new Date(),
        changedBy: req.user._id,
        owner: req.ownerId,
      });
      await Product.findByIdAndUpdate(productId, { buyingPrice: Number(buyingPrice) });
      return res.status(201).json({
        success: true,
        message: "Purchase recorded! Buying price changed — review selling price.",
        data: purchase,
        priceAlert: {
          oldBuyingPrice,
          newBuyingPrice: Number(buyingPrice),
          oldSellingPrice: product.sellingPrice,
          suggestedSellingPrice: Math.ceil(suggestedSellingPrice),
          message: `Buying price changed from ₹${oldBuyingPrice} to ₹${buyingPrice}. Suggested selling: ₹${Math.ceil(suggestedSellingPrice)}`,
        },
      });
    }
    res.status(201).json({ success: true, message: "Purchase recorded and stock updated!", data: purchase });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ owner: req.ownerId })
      .populate("productId", "productName category")
      .populate("supplierId", "supplierName phone")
      .populate("enteredBy", "name")
      .sort({ purchaseDate: -1 })
      .limit(200);
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createPurchase, getPurchases };
