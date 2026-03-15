// ============================================
//   Udhar Payment Controller
//   Handles credit repayments from customers
// ============================================

const { UdharPayment } = require("../models/OtherModels");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");

// ---- Record a Payment from Customer ----
// POST /api/udhar/pay
const recordPayment = async (req, res) => {
  try {
    const { customerId, saleId, paymentMode, notes } = req.body;

    // **BUG FIX:** Convert paidAmount to Number — frontend sometimes sends a string
    const paidAmount = Number(req.body.paidAmount);

    // Get customer to find current udhar balance
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    // Check payment is not more than what they owe
    if (paidAmount > customer.totalUdhar) {
      return res.status(400).json({
        success: false,
        message: `Customer only owes ₹${customer.totalUdhar}. Cannot accept ₹${paidAmount}.`,
      });
    }

    const remainingBalance = customer.totalUdhar - paidAmount;

    // Save the payment record
    const payment = await UdharPayment.create({
      customerId,
      saleId,
      paidAmount,
      remainingBalance,
      paymentMode: paymentMode || "cash",
      notes,
      recordedBy: req.user._id,
    });

    // Update customer balance + recalculate risk level
    const updatedCustomer = await Customer.findById(customerId);
    updatedCustomer.totalUdhar = Math.max(0, updatedCustomer.totalUdhar - paidAmount);
    updatedCustomer.lastPaymentDate = new Date();
    if (updatedCustomer.totalUdhar > 5000) updatedCustomer.riskLevel = "high";
    else if (updatedCustomer.totalUdhar > 2000) updatedCustomer.riskLevel = "medium";
    else updatedCustomer.riskLevel = "low";
    await updatedCustomer.save();

    // If a specific sale was paid, update it
    if (saleId) {
      const sale = await Sale.findById(saleId);
      if (sale) {
        const newDue = Math.max(0, sale.dueAmount - paidAmount);
        await Sale.findByIdAndUpdate(saleId, {
          dueAmount: newDue,
          paidAmount: sale.paidAmount + paidAmount,
          isPaid: newDue <= 0,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paidAmount} recorded. Remaining balance: ₹${remainingBalance}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get Payment History for a Customer ----
// GET /api/udhar/history/:customerId
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await UdharPayment.find({ customerId: req.params.customerId })
      .populate("recordedBy", "name")
      .sort({ paymentDate: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Get All Pending Udhars ----
// GET /api/udhar/pending
const getAllPendingUdhars = async (req, res) => {
  try {
    const customers = await Customer.find({ totalUdhar: { $gt: 0 }, isActive: true })
      .sort({ totalUdhar: -1 });

    const totalPending = customers.reduce((sum, c) => sum + c.totalUdhar, 0);

    res.json({
      success: true,
      totalPending,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { recordPayment, getPaymentHistory, getAllPendingUdhars };
