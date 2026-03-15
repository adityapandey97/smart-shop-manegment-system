// ============================================
//   UdharPayment Model
//   Tracks partial repayments from customers
// ============================================

const mongoose = require("mongoose");

const udharPaymentSchema = new mongoose.Schema(
  {
    // Which customer paid
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    // Which sale bill this payment is for
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sale",
    },

    // How much was paid in this payment
    paidAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 1,
    },

    // Balance still remaining after this payment
    remainingBalance: {
      type: Number,
      required: true,
    },

    // Date of this payment
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // How did they pay?
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "card", "bank_transfer"],
      default: "cash",
    },

    // Notes
    notes: { type: String },

    // Who recorded this payment
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const UdharPayment = mongoose.model("UdharPayment", udharPaymentSchema);

// ============================================
//   PriceHistory Model
//   Tracks every time a product's price changed
// ============================================

const priceHistorySchema = new mongoose.Schema(
  {
    // Which product had price change
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    // Old buying price before change
    oldBuyingPrice: { type: Number, required: true },

    // New buying price after change
    newBuyingPrice: { type: Number, required: true },

    // Old selling price before change
    oldSellingPrice: { type: Number, required: true },

    // System-suggested new selling price based on margin
    suggestedSellingPrice: { type: Number },

    // Actual selling price updated by owner
    actualNewSellingPrice: { type: Number },

    // Target profit margin used for suggestion
    targetMargin: { type: Number, default: 20 },

    // Why did price change? (new purchase, market rate change, etc.)
    reason: { type: String },

    // When did the change happen
    changeDate: { type: Date, default: Date.now },

    // Who made the change
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const PriceHistory = mongoose.model("PriceHistory", priceHistorySchema);

// ============================================
//   Expense Model
//   Tracks all shop expenses (rent, light bill, etc.)
// ============================================

const expenseSchema = new mongoose.Schema(
  {
    // Type: rent, electricity, salary, transport, other
    expenseType: {
      type: String,
      required: [true, "Expense type is required"],
      enum: ["rent", "electricity", "salary", "transport", "maintenance", "marketing", "other"],
    },

    // Custom label for "other" type
    customLabel: { type: String },

    // Amount spent
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },

    // Date expense happened
    date: {
      type: Date,
      default: Date.now,
    },

    // Notes about this expense
    note: { type: String },

    // Payment method
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "card"],
      default: "cash",
    },

    // Receipt image URL (optional)
    receiptUrl: { type: String },

    // Who added this expense
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = { UdharPayment, PriceHistory, Expense };
