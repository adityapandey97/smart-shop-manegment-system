// ============================================
//   Customer Controller
// ============================================
const Customer = require("../models/Customer");
const Sale = require("../models/Sale");

const getCustomers = async (req, res) => {
  try {
    const filter = { isActive: true };
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
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, message: "Customer added!", data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCustomerLedger = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
    const sales = await Sale.find({ customerId: req.params.id }).sort({ saleDate: -1 });
    res.json({ success: true, data: { customer, sales } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getCustomers, createCustomer, updateCustomer, getCustomerLedger };
