// ============================================
//   Product Model
//   Stores all product info for the shop
// ============================================

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // Product display name
    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    // Category like "Grocery", "Dairy", "Snacks"
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    // SKU = Stock Keeping Unit (unique product code)
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allow null SKU without duplicate error
    },

    // How many units are currently in stock
    stockQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Alert when stock goes below this number
    minStockLevel: {
      type: Number,
      default: 5,
    },

    // Unit of measurement: kg, piece, litre, etc.
    unit: {
      type: String,
      default: "piece",
    },

    // Price at which shop bought this product
    buyingPrice: {
      type: Number,
      required: [true, "Buying price is required"],
      min: 0,
    },

    // Price at which shop sells this product to customers
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: 0,
    },

    // MRP (Maximum Retail Price) printed on product
    mrp: {
      type: Number,
      min: 0,
    },

    // If product expires (like food, medicine), track date
    expiryDate: {
      type: Date,
    },

    // Link to supplier who provides this product
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },

    // Product image URL (from Cloudinary)
    imageUrl: {
      type: String,
      default: "",
    },

    // Is this product active in the system?
    isActive: {
      type: Boolean,
      default: true,
    },

    // Track last time this product was sold (for dead stock detection)
    lastSoldDate: {
      type: Date,
    },

    // Auto-calculated: how many sold in last 30 days (for predictions)
    avgDailySales: {
      type: Number,
      default: 0,
    },

    // Dead stock = not sold in 30-60 days, still in stock
    isDeadStock: {
      type: Boolean,
      default: false,
    },

    // Barcode number for future barcode scanner feature
    barcode: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ----- Virtual field: calculate profit margin -----
// This is not stored in DB but calculated when needed
productSchema.virtual("profitMargin").get(function () {
  if (this.buyingPrice === 0) return 0;
  return (((this.sellingPrice - this.buyingPrice) / this.buyingPrice) * 100).toFixed(2);
});

// ----- Virtual: check if stock is low -----
productSchema.virtual("isLowStock").get(function () {
  return this.stockQuantity <= this.minStockLevel;
});

// ----- Virtual: estimated days until stock runs out -----
productSchema.virtual("daysUntilStockOut").get(function () {
  if (this.avgDailySales === 0) return null;
  return Math.floor(this.stockQuantity / this.avgDailySales);
});

// Make virtual fields show up in JSON output
productSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
