// ============================================
//   Supplier Controller — with owner isolation
// ============================================
const Supplier = require("../models/Supplier");
const Purchase = require("../models/Purchase");

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ isActive: true, owner: req.ownerId }).sort({ supplierName: 1 });
    res.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, owner: req.ownerId });
    res.status(201).json({ success: true, message: "Supplier added!", data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, owner: req.ownerId },
      req.body,
      { new: true }
    );
    if (!supplier) return res.status(404).json({ success: false, message: "Supplier not found." });
    res.json({ success: true, data: supplier });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    await Supplier.findOneAndUpdate({ _id: req.params.id, owner: req.ownerId }, { isActive: false });
    res.json({ success: true, message: "Supplier removed." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupplierComparison = async (req, res) => {
  try {
    const { productId } = req.query;
    const purchases = await Purchase.find({ productId, owner: req.ownerId })
      .populate("supplierId", "supplierName phone rating")
      .sort({ purchaseDate: -1 });
    const supplierMap = {};
    purchases.forEach((p) => {
      if (p.supplierId && !supplierMap[p.supplierId._id]) {
        supplierMap[p.supplierId._id] = {
          supplier: p.supplierId,
          lastPrice: p.buyingPrice,
          lastPurchaseDate: p.purchaseDate,
        };
      }
    });
    const comparison = Object.values(supplierMap).sort((a, b) => a.lastPrice - b.lastPrice);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSuppliers, createSupplier, updateSupplier, deleteSupplier, getSupplierComparison };
