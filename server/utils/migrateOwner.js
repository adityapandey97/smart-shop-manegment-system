// ============================================
//   DATA MIGRATION SCRIPT
//   Run ONCE on Render Shell after deploying
//   Assigns existing data to the first Owner
//
//   HOW TO RUN:
//   Render Dashboard → your service → Shell tab
//   Type: node server/utils/migrateOwner.js
// ============================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const User = require("../models/User");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Supplier = require("../models/Supplier");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const { Expense, PriceHistory, UdharPayment } = require("../models/OtherModels");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find the first Owner account
    const owner = await User.findOne({ role: "owner" }).sort({ createdAt: 1 });
    if (!owner) {
      console.log("No owner account found. Register first then run this.");
      process.exit(1);
    }
    console.log("Owner found:", owner.name, owner.email);

    const ownerId = owner._id;
    const collections = [
      { model: Product,      name: "Products" },
      { model: Customer,     name: "Customers" },
      { model: Supplier,     name: "Suppliers" },
      { model: Sale,         name: "Sales" },
      { model: Purchase,     name: "Purchases" },
      { model: Expense,      name: "Expenses" },
      { model: PriceHistory, name: "PriceHistory" },
      { model: UdharPayment, name: "UdharPayments" },
    ];

    for (const col of collections) {
      const result = await col.model.updateMany(
        { owner: { $exists: false } },
        { $set: { owner: ownerId } }
      );
      console.log(col.name + ": " + result.modifiedCount + " records updated");
    }

    console.log("Migration complete!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  }
}

migrate();
