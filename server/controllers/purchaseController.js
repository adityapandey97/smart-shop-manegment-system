// ============================================
//   Purchase Controller
//   Records stock purchases + triggers price history
// ============================================

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const { PriceHistory } = require("../models/OtherModels");

// ---- Create New Purchase ----
// POST /api/purchases
const createPurchase = async (req, res) => {
  try {
    const { productId, supplierId, quantity, buyingPrice, purchaseDate, invoiceNumber, notes, paymentStatus, paidAmount } = req.body;

    // Get the product to compare prices
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const totalCost = quantity * buyingPrice;

    // --- Step 1: Save the purchase record ---
    const purchase = await Purchase.create({
      productId,
      supplierId,
      quantity,
      buyingPrice,
      totalCost,
      purchaseDate: purchaseDate || new Date(),
      invoiceNumber,
      notes,
      paymentStatus: paymentStatus || "paid",
      paidAmount: paidAmount || totalCost,
      enteredBy: req.user._id,
    });

    // --- Step 2: Update product stock quantity ---
    await Product.findByIdAndUpdate(productId, {
      $inc: { stockQuantity: quantity }, // Add to existing stock
    });

    // --- Step 3: Check if buying price has changed ---
    const oldBuyingPrice = product.buyingPrice;
    if (buyingPrice !== oldBuyingPrice) {
      // Calculate suggested selling price at 20% margin
      const targetMargin = 20;
      const suggestedSellingPrice = buyingPrice * (1 + targetMargin / 100);

      // Save price change history
      await PriceHistory.create({
        productId,
        oldBuyingPrice,
        newBuyingPrice: buyingPrice,
        oldSellingPrice: product.sellingPrice,
        suggestedSellingPrice: Math.ceil(suggestedSellingPrice), // Round up
        targetMargin,
        reason: "New stock purchased at different price",
        changeDate: new Date(),
        changedBy: req.user._id,
      });

      // Update the product's current buying price
      await Product.findByIdAndUpdate(productId, { buyingPrice });

      return res.status(201).json({
        success: true,
        message: "Purchase recorded! ⚠️ Buying price changed — please review selling price.",
        data: purchase,
        priceAlert: {
          oldBuyingPrice,
          newBuyingPrice: buyingPrice,
          oldSellingPrice: product.sellingPrice,
          suggestedSellingPrice: Math.ceil(suggestedSellingPrice),
          message: `Buying price changed from ₹${oldBuyingPrice} to ₹${buyingPrice}. Suggested selling price: ₹${Math.ceil(suggestedSellingPrice)}`,
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Purchase recorded and stock updated!",
      data: purchase,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get All Purchases ----
// GET /api/purchases
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find()
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
