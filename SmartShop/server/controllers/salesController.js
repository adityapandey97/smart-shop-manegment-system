// ============================================
//   Sales Controller — with owner isolation
// ============================================
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

const createSale = async (req, res) => {
  try {
    const { customerId, customerName, items, paymentMode, paidAmount, discount, notes } = req.body;

    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, owner: req.ownerId });
      if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ success: false, message: `Not enough stock for "${product.productName}". Available: ${product.stockQuantity}` });
      }
      const itemTotal = item.quantity * product.sellingPrice;
      const itemProfit = (product.sellingPrice - product.buyingPrice) * item.quantity;
      processedItems.push({
        productId: product._id, productName: product.productName,
        quantity: item.quantity, sellingPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice, totalPrice: itemTotal, profit: itemProfit,
      });
      totalAmount += itemTotal;
    }

    const discountAmount = discount || 0;
    const finalAmount = totalAmount - discountAmount;
    let paid;
    if (paymentMode === "udhar") {
      paid = 0;
    } else {
      paid = (paidAmount !== undefined && paidAmount !== null && paidAmount !== "")
        ? Number(paidAmount) : finalAmount;
    }
    const due = finalAmount - paid;

    // Validate: udhar needs a real customer
    if (paymentMode === "udhar" && !customerId) {
      return res.status(400).json({ success: false, message: "Please select a customer for udhar sales." });
    }

    const sale = await Sale.create({
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      items: processedItems, totalAmount: finalAmount,
      paymentMode, paidAmount: paid, dueAmount: due, isPaid: due <= 0,
      discount: discountAmount, notes,
      processedBy: req.user._id,
      owner: req.ownerId,
    });

    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity },
        lastSoldDate: new Date(),
      });
      const product = await Product.findById(item.productId);
      if (product) {
        product.avgDailySales = Math.max(0.1, (product.avgDailySales + item.quantity) / 2);
        product.isDeadStock = false;
        await product.save();
      }
    }

    if (customerId && due > 0) {
      const updatedCustomer = await Customer.findOneAndUpdate(
        { _id: customerId, owner: req.ownerId },
        { $inc: { totalUdhar: due } },
        { new: true }
      );
      if (updatedCustomer) {
        await sale.updateOne({ customerName: updatedCustomer.name });
      }
    }

    res.status(201).json({ success: true, message: "Sale created successfully!", data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSales = async (req, res) => {
  try {
    const filter = { owner: req.ownerId };
    if (req.query.startDate && req.query.endDate) {
      filter.saleDate = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }
    if (req.query.customerId) filter.customerId = req.query.customerId;
    const sales = await Sale.find(filter)
      .populate("customerId", "name phone")
      .populate("processedBy", "name")
      .sort({ saleDate: -1 })
      .limit(req.query.limit ? parseInt(req.query.limit) : 100);
    res.json({ success: true, count: sales.length, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findOne({ _id: req.params.id, owner: req.ownerId })
      .populate("customerId", "name phone address")
      .populate("processedBy", "name");
    if (!sale) return res.status(404).json({ success: false, message: "Sale not found." });
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSale, getSales, getSaleById };
