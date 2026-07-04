const Customer = require("../models/Customer");
const Sale = require("../models/Sale");
const { UdharPayment } = require("../models/OtherModels");
const axios = require("axios");

const getCustomers = async (req, res) => {
  try {
    const filter = { isActive: true, owner: req.ownerId };
    if (req.query.risk) filter.riskLevel = req.query.risk;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };
    const customers = await Customer.find(filter).sort({ totalUdhar: -1 });
    res.json({ success: true, count: customers.length, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({ ...req.body, owner: req.ownerId });
    res.status(201).json({ success: true, message: "Customer added!", data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.ownerId },
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerLedger = async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.ownerId });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    const sales = await Sale.find({ customerId: req.params.id, owner: req.ownerId }).sort({ saleDate: -1 });
    res.json({ success: true, data: { customer, sales } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const analyzeCustomerRisk = async (req, res) => {
  try {
    const owner = req.ownerId;
    const customer = await Customer.findOne({ _id: req.params.id, owner });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found." });
    }

    // Get total payments count
    const payments = await UdharPayment.find({ customerId: customer._id, owner });
    
    // Call Python Flask AI service
    let riskData;
    try {
      const aiResponse = await axios.post("http://localhost:5001/analyze-customer-risk", {
        totalUdhar: customer.totalUdhar,
        delayCount: customer.delayCount || 0,
        daysSincePayment: customer.lastPaymentDate 
          ? Math.floor((new Date() - new Date(customer.lastPaymentDate)) / (1000 * 60 * 60 * 24))
          : 90, // default to 90 days if never paid
        totalPayments: payments.length
      });
      riskData = aiResponse.data.data;
    } catch (err) {
      console.warn("Could not connect to Flask AI Service, using fallback risk scoring.");
      // Fallback scoring in JS
      const totalUdhar = customer.totalUdhar;
      const risk = totalUdhar > 5000 ? "high" : totalUdhar > 2000 ? "medium" : "low";
      riskData = {
        riskScore: Math.min(100, Math.round(totalUdhar / 100)),
        riskLevel: risk,
        advice: risk === "high" 
          ? "🚨 Do not give more udhar. Request immediate payment." 
          : "✅ Safe to give udhar."
      };
    }

    res.json({ success: true, data: riskData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, getCustomerLedger, analyzeCustomerRisk };
