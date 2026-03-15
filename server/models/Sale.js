// ============================================
//   Sale Model
//   Records every sale / billing transaction
// ============================================

const mongoose = require("mongoose");

// Schema for each item in a sale bill
const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productName: { type: String }, // Snapshot of name at time of sale
  quantity: { type: Number, required: true, min: 1 },
  sellingPrice: { type: Number, required: true }, // Price at time of sale
  buyingPrice: { type: Number, required: true },  // Cost price at time of sale
  totalPrice: { type: Number, required: true },   // sellingPrice × quantity
  profit: { type: Number },                       // (sellingPrice - buyingPrice) × quantity
});

const saleSchema = new mongoose.Schema(
  {
    // Bill number (like INV-001)
    billNumber: {
      type: String,
      unique: true,
    },

    // Who bought? (can be null for walk-in customers)
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },

    // Customer name (for quick display without DB lookup)
    customerName: { type: String, default: "Walk-in Customer" },

    // List of items sold in this bill
    items: [saleItemSchema],

    // Total bill amount
    totalAmount: {
      type: Number,
      required: true,
    },

    // How was it paid?
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "udhar", "razorpay", "mixed"],
      default: "cash",
    },

    // How much was paid right now
    paidAmount: {
      type: Number,
      default: 0,
    },

    // How much is still pending (for udhar)
    dueAmount: {
      type: Number,
      default: 0,
    },

    // Is this sale fully paid?
    isPaid: {
      type: Boolean,
      default: true,
    },

    // Razorpay payment ID (if paid online)
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },

    // Date of sale
    saleDate: {
      type: Date,
      default: Date.now,
    },

    // GST details (for future)
    gstNumber: { type: String },
    gstAmount: { type: Number, default: 0 },

    // Discount given
    discount: { type: Number, default: 0 },

    // Who processed this sale
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notes on this sale
    notes: { type: String },
  },
  { timestamps: true }
);

// Auto-generate bill number before saving
saleSchema.pre("save", async function (next) {
  if (!this.billNumber) {
    // Count existing sales and create INV-001, INV-002, etc.
    const count = await mongoose.model("Sale").countDocuments();
    this.billNumber = `INV-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Sale", saleSchema);
