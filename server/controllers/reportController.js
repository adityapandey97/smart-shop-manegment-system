// ============================================
//   Reports Controller
//   Business analytics: profit, stock, udhar
// ============================================

const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const { Expense } = require("../models/OtherModels");

// ---- Dashboard Summary ----
// GET /api/reports/dashboard
const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Start of current month
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // --- Today's Sales ---
    const todaySales = await Sale.find({ saleDate: { $gte: today, $lte: todayEnd } });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayProfit = todaySales.reduce(
      (sum, s) => sum + s.items.reduce((is, item) => is + (item.profit || 0), 0), 0
    );

    // --- Monthly Sales ---
    const monthSales = await Sale.find({ saleDate: { $gte: monthStart } });
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthProfit = monthSales.reduce(
      (sum, s) => sum + s.items.reduce((is, item) => is + (item.profit || 0), 0), 0
    );

    // --- Monthly Expenses ---
    const monthExpenses = await Expense.find({ date: { $gte: monthStart } });
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = monthProfit - totalExpenses;

    // --- Stock ---
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ["$stockQuantity", "$minStockLevel"] },
    });

    // Total stock value
    const products = await Product.find({ isActive: true });
    const totalStockValue = products.reduce(
      (sum, p) => sum + p.stockQuantity * p.buyingPrice, 0
    );

    // Dead stock count
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 45);
    const deadStockCount = await Product.countDocuments({
      isActive: true,
      stockQuantity: { $gt: 0 },
      $or: [{ lastSoldDate: { $lt: cutoff } }, { lastSoldDate: null }],
    });

    // --- Udhar ---
    const udharCustomers = await Customer.find({ totalUdhar: { $gt: 0 }, isActive: true });
    const totalPendingUdhar = udharCustomers.reduce((sum, c) => sum + c.totalUdhar, 0);
    const highRiskCount = udharCustomers.filter((c) => c.riskLevel === "high").length;

    // --- Top Selling Products (this month) ---
    const topProducts = await Sale.aggregate([
      { $match: { saleDate: { $gte: monthStart } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalQty: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          totalProfit: { $sum: "$items.profit" },
        },
      },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    // --- Daily sales for chart (last 7 days) ---
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const daySales = await Sale.find({ saleDate: { $gte: day, $lte: dayEnd } });
      last7Days.push({
        date: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        revenue: daySales.reduce((s, sale) => s + sale.totalAmount, 0),
        profit: daySales.reduce(
          (s, sale) => s + sale.items.reduce((is, item) => is + (item.profit || 0), 0), 0
        ),
      });
    }

    res.json({
      success: true,
      data: {
        today: {
          revenue: todayRevenue,
          profit: todayProfit,
          salesCount: todaySales.length,
        },
        month: {
          revenue: monthRevenue,
          profit: monthProfit,
          expenses: totalExpenses,
          netProfit,
          salesCount: monthSales.length,
        },
        stock: {
          totalProducts,
          lowStockProducts,
          deadStockCount,
          totalStockValue,
        },
        udhar: {
          totalPending: totalPendingUdhar,
          customerCount: udharCustomers.length,
          highRiskCount,
        },
        topProducts,
        last7Days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---- Profit Report ----
// GET /api/reports/profit
const getProfitReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.saleDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const sales = await Sale.find(filter);

    // Product-wise profit breakdown
    const productProfit = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
          totalProfit: { $sum: "$items.profit" },
          avgMargin: {
            $avg: {
              $multiply: [
                { $divide: [{ $subtract: ["$items.sellingPrice", "$items.buyingPrice"] }, "$items.buyingPrice"] },
                100,
              ],
            },
          },
        },
      },
      { $sort: { totalProfit: -1 } },
    ]);

    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce(
      (sum, s) => sum + s.items.reduce((is, item) => is + (item.profit || 0), 0), 0
    );

    res.json({
      success: true,
      data: { totalRevenue, totalProfit, productProfit, salesCount: sales.length },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getProfitReport };
