// ============================================
//   SmartShop Backend - Main Server File
//   This is the starting point of the backend
// ============================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env file
dotenv.config();

// Create the Express app
const app = express();

// ---- Middleware Setup ----

// Allow frontend to talk to backend (CORS)
app.use(
  cors({
    // Allow both local dev and deployed Vercel frontend
    origin: function (origin, callback) {
      const allowed = [
        "http://localhost:3000",
        process.env.CLIENT_URL,  // your Vercel URL e.g. https://smartshop.vercel.app
      ].filter(Boolean);
      // Allow requests with no origin (Postman, mobile apps)
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Parse incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Import All Route Files ----
const { setOwnerFilter } = require("./middleware/ownerMiddleware");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const customerRoutes = require("./routes/customerRoutes");
const udharRoutes = require("./routes/udharRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const reportRoutes = require("./routes/reportRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const pricingRoutes = require("./routes/pricingRoutes");

// ---- Register Routes with URL prefix ----
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/udhar", udharRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/pricing", pricingRoutes);

// ---- Serve React frontend in production ----
if (process.env.NODE_ENV === "production") {
  // Serve the built React files
  app.use(express.static(path.join(__dirname, "../client/build")));

  // For any route not matched by API, send the React app
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../client/build", "index.html"));
  });
} else {
  // Simple test route for development
  app.get("/", (req, res) => {
    res.json({ message: "SmartShop API is running in development mode!" });
  });
}

// ---- Error Handler Middleware ----
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ---- Connect to MongoDB then Start Server ----
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully!");
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📱 Open: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1); // Stop the server if database fails
  });
