// ============================================
//   Sales Controller
//   Handles creating sales bills
// ============================================

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");

// ---- Create New Sale ----
// POST /api/sales
const createSale = async (req, res) => {
  try {
    const { customerId, customerName, items, paymentMode, paidAmount, discount, notes } = req.body;

    // --- Step 1: Validate all items and calculate totals ---
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      // Get product from database
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      }

      // Check if enough stock is available
      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${product.productName}". Available: ${product.stockQuantity}`,
        });
      }

      const itemTotal = item.quantity * product.sellingPrice;
      const itemProfit = (product.sellingPrice - product.buyingPrice) * item.quantity;

      processedItems.push({
        productId: product._id,
        productName: product.productName, // Save name snapshot
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice,
        totalPrice: itemTotal,
        profit: itemProfit,
      });

      totalAmount += itemTotal;
    }

    // Apply discount
    const discountAmount = discount || 0;
    const finalAmount = totalAmount - discountAmount;

    // **BUG FIX:** JavaScript treats 0 as falsy. When payment mode is "udhar", frontend sends paidAmount=0.
    // The || operator replaces 0 with finalAmount, making every udhar sale look "fully paid".
    // Result: due was always 0, so customer udhar balance was never updated.
    let paid;
    if (paymentMode === "udhar") {
      paid = 0; // Udhar = nothing paid now
    } else {
      paid = (paidAmount !== undefined && paidAmount !== null && paidAmount !== "")
        ? Number(paidAmount)
        : finalAmount; // Cash/UPI = fully paid by default
    }
    const due = finalAmount - paid;

    // --- Step 2: Create the sale record ---
    const sale = await Sale.create({
      customerId: customerId || null,
      customerName: customerName || "Walk-in Customer",
      items: processedItems,
      totalAmount: finalAmount,
      paymentMode,
      paidAmount: paid,
      dueAmount: due,
      isPaid: due <= 0,
      discount: discountAmount,
      notes,
      processedBy: req.user._id,
    });

    // --- Step 3: Deduct stock for each sold item ---
    for (const item of processedItems) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stockQuantity: -item.quantity }, // Reduce stock
        lastSoldDate: new Date(),                // Update last sold date
      });

      // Recalculate average daily sales (simple rolling average)
      const product = await Product.findById(item.productId);
      if (product) {
        product.avgDailySales = Math.max(0.1, (product.avgDailySales + item.quantity / 1) / 2);
        product.isDeadStock = false; // If sold, not dead stock
        await product.save();
      }
    }

    // --- Step 4: Update customer udhar if due amount exists ---
    // **BUG FIX 2:** Previously only checked (customerId && due > 0)
    // This failed when: customer selected but paymentMode was not "udhar"
    // Also failed to update customerName from customer record
    if (customerId && due > 0) {
      const updatedCustomer = await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { totalUdhar: due } }, // Add the due amount to total pending
        { new: true }
      );

      // **BUG FIX 3:** Also update customerName on the sale from actual customer record
      // so it shows correctly in Udhar page
      if (updatedCustomer) {
        await sale.updateOne({ customerName: updatedCustomer.name });
      }
    }

    res.status(201).json({ success: true, message: "Sale created successfully!", data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get All Sales ----
// GET /api/sales
const getSales = async (req, res) => {
  try {
    // Filter by date range if provided
    const filter = {};
    if (req.query.startDate && req.query.endDate) {
      filter.saleDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
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

// ---- Get Single Sale ----
// GET /api/sales/:id
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customerId", "name phone address")
      .populate("processedBy", "name");

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found." });
    }
    res.json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createSale, getSales, getSaleById };
