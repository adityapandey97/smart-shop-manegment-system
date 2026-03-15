// ============================================
//   Purchase Model
//   Records every time we buy stock from suppliers
// ============================================

const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    // Which product was purchased
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // From which supplier
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    // How many units bought
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: 1,
    },

    // Price per unit when buying
    buyingPrice: {
      type: Number,
      required: [true, "Buying price is required"],
      min: 0,
    },

    // Total cost = quantity × buyingPrice
    totalCost: {
      type: Number,
      required: true,
    },

    // Was this paid or pending?
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partial"],
      default: "paid",
    },

    // How much was paid (for partial payments)
    paidAmount: {
      type: Number,
      default: 0,
    },

    // Date of purchase
    purchaseDate: {
      type: Date,
      default: Date.now,
    },

    // Invoice number from supplier
    invoiceNumber: { type: String },

    // Notes
    notes: { type: String },

    // Which staff entered this purchase
    // Owner: which shop owner does this record belong to?
    // This ensures different shop owners never see each other's data
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,  // index for fast filtering
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
