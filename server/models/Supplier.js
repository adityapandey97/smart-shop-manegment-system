// ============================================
//   Supplier Model
//   Stores details of people/companies we buy from
// ============================================

const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    email: { type: String },
    address: { type: String },
    // What products this supplier provides
    productsSupplied: [{ type: String }],
    // Notes about this supplier
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    // Rating 1-5 for this supplier
    rating: { type: Number, min: 1, max: 5, default: 3 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Supplier", supplierSchema);
