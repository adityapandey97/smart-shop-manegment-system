// ============================================
//   Udhar Controller — with owner isolation
// ============================================
const { UdharPayment } = require("../models/OtherModels");
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");

const recordPayment = async (req, res) => {
  try {
    const { customerId, saleId, paymentMode, notes } = req.body;
    const paidAmount = Number(req.body.paidAmount);

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than 0." });
    }

    const customer = await Customer.findOne({ _id: customerId, owner: req.ownerId });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });

    if (paidAmount > customer.totalUdhar) {
      return res.status(400).json({ success: false, message: `Customer only owes ₹${customer.totalUdhar}.` });
    }

    const remainingBalance = Math.max(0, customer.totalUdhar - paidAmount);

    const payment = await UdharPayment.create({
      customerId, saleId, paidAmount, remainingBalance,
      paymentMode: paymentMode || "cash", notes,
      recordedBy: req.user._id,
      owner: req.ownerId,
    });

    customer.totalUdhar = remainingBalance;
    customer.lastPaymentDate = new Date();
    if (customer.totalUdhar > 5000) customer.riskLevel = "high";
    else if (customer.totalUdhar > 2000) customer.riskLevel = "medium";
    else customer.riskLevel = "low";
    await customer.save();

    if (saleId) {
      const sale = await Sale.findOne({ _id: saleId, owner: req.ownerId });
      if (sale) {
        const newDue = Math.max(0, sale.dueAmount - paidAmount);
        await Sale.findByIdAndUpdate(saleId, {
          dueAmount: newDue, paidAmount: sale.paidAmount + paidAmount, isPaid: newDue <= 0,
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Payment of ₹${paidAmount} recorded. Remaining: ₹${remainingBalance}`,
      data: payment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const payments = await UdharPayment.find({ customerId: req.params.customerId, owner: req.ownerId })
      .populate("recordedBy", "name").sort({ paymentDate: -1 });
    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPendingUdhars = async (req, res) => {
  try {
    const customers = await Customer.find({ totalUdhar: { $gt: 0 }, isActive: true, owner: req.ownerId })
      .sort({ totalUdhar: -1 });
    const totalPending = customers.reduce((sum, c) => sum + c.totalUdhar, 0);
    res.json({ success: true, totalPending, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { recordPayment, getPaymentHistory, getAllPendingUdhars };
