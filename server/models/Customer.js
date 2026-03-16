// ============================================
//   Customer Model
//   Stores customer info and udhar (credit) details
// ============================================

const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    email: { type: String },
    address: { type: String },

    // Total udhar (credit) amount still pending
    totalUdhar: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Risk level for giving udhar
    // low = safe, medium = caution, high = do not give more udhar
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },

    // Number of times payment was delayed
    delayCount: {
      type: Number,
      default: 0,
    },

    // Last time this customer paid
    lastPaymentDate: { type: Date },

    // Is this customer still active?
    isActive: { type: Boolean, default: true },

    // Notes about this customer
    notes: { type: String },
    // Owner: which shop owner does this record belong to?
    // This ensures different shop owners never see each other's data
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,  // index for fast filtering
    },
  },
  { timestamps: true }
);

// BUG FIX: Old pre-save hook overwrote riskLevel on EVERY save,
// including when udharController manually set it after payment.
// Fix: Only auto-calculate risk when totalUdhar or delayCount actually changed.
// This prevents the hook from fighting with manual risk updates.
customerSchema.pre("save", function (next) {
  // Only recalculate if these key fields were modified
  if (this.isModified("totalUdhar") || this.isModified("delayCount")) {
    if (this.totalUdhar > 5000 || this.delayCount >= 5) {
      this.riskLevel = "high";
    } else if (this.totalUdhar > 2000 || this.delayCount >= 2) {
      this.riskLevel = "medium";
    } else {
      this.riskLevel = "low";
    }
  }
  next();
});

module.exports = mongoose.model("Customer", customerSchema);
