// ============================================
//   Reports Controller — with owner isolation
// ============================================
const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const { Expense } = require("../models/OtherModels");
const axios = require("axios");

const getDashboard = async (req, res) => {
  try {
    const owner = req.ownerId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todaySales = await Sale.find({ owner, saleDate: { $gte: today, $lte: todayEnd } });
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayProfit = todaySales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + (i.profit || 0), 0), 0);

    const monthSales = await Sale.find({ owner, saleDate: { $gte: monthStart } });
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthProfit = monthSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + (i.profit || 0), 0), 0);

    const monthExpenses = await Expense.find({ owner, date: { $gte: monthStart } });
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = monthProfit - totalExpenses;

    const totalProducts = await Product.countDocuments({ isActive: true, owner });
    const products = await Product.find({ isActive: true, owner });
    const lowStockProducts = products.filter(p => p.stockQuantity <= p.minStockLevel).length;
    const totalStockValue = products.reduce((sum, p) => sum + p.stockQuantity * p.buyingPrice, 0);

    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 45);
    const deadStockCount = products.filter(p =>
      p.stockQuantity > 0 && (!p.lastSoldDate || p.lastSoldDate < cutoff)
    ).length;

    const udharCustomers = await Customer.find({ totalUdhar: { $gt: 0 }, isActive: true, owner });
    const totalPendingUdhar = udharCustomers.reduce((sum, c) => sum + c.totalUdhar, 0);
    const highRiskCount = udharCustomers.filter(c => c.riskLevel === "high").length;

    const topProducts = await Sale.aggregate([
      { $match: { owner, saleDate: { $gte: monthStart } } },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", productName: { $first: "$items.productName" }, totalQty: { $sum: "$items.quantity" }, totalRevenue: { $sum: "$items.totalPrice" }, totalProfit: { $sum: "$items.profit" } } },
      { $sort: { totalQty: -1 } },
      { $limit: 5 },
    ]);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(); day.setDate(day.getDate() - i); day.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
      const daySales = await Sale.find({ owner, saleDate: { $gte: day, $lte: dayEnd } });
      last7Days.push({
        date: day.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" }),
        revenue: daySales.reduce((s, sale) => s + sale.totalAmount, 0),
        profit: daySales.reduce((s, sale) => s + sale.items.reduce((is, item) => is + (item.profit || 0), 0), 0),
      });
    }

    res.json({
      success: true,
      data: {
        today: { revenue: todayRevenue, profit: todayProfit, salesCount: todaySales.length },
        month: { revenue: monthRevenue, profit: monthProfit, expenses: totalExpenses, netProfit, salesCount: monthSales.length },
        stock: { totalProducts, lowStockProducts, deadStockCount, totalStockValue },
        udhar: { totalPending: totalPendingUdhar, customerCount: udharCustomers.length, highRiskCount },
        topProducts, last7Days,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfitReport = async (req, res) => {
  try {
    const filter = { owner: req.ownerId };
    if (req.query.startDate && req.query.endDate) {
      filter.saleDate = { $gte: new Date(req.query.startDate), $lte: new Date(req.query.endDate) };
    }
    const sales = await Sale.find(filter);
    const productProfit = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", productName: { $first: "$items.productName" }, totalSold: { $sum: "$items.quantity" }, totalRevenue: { $sum: "$items.totalPrice" }, totalProfit: { $sum: "$items.profit" }, avgMargin: { $avg: { $multiply: [{ $divide: [{ $subtract: ["$items.sellingPrice", "$items.buyingPrice"] }, "$items.buyingPrice"] }, 100] } } } },
      { $sort: { totalProfit: -1 } },
    ]);
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalProfit = sales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + (i.profit || 0), 0), 0);
    res.json({ success: true, data: { totalRevenue, totalProfit, productProfit, salesCount: sales.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAIInsights = async (req, res) => {
  try {
    const owner = req.ownerId;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get current month sales
    const monthSales = await Sale.find({ owner, saleDate: { $gte: monthStart } });
    const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalAmount, 0);
    const monthProfit = monthSales.reduce((sum, s) => sum + s.items.reduce((is, i) => is + (i.profit || 0), 0), 0);
    
    // Get current month expenses
    const monthExpenses = await Expense.find({ owner, date: { $gte: monthStart } });
    const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Get previous month sales (approximate)
    const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const prevMonthSales = await Sale.find({ owner, saleDate: { $gte: prevMonthStart, $lte: prevMonthEnd } });
    const prevMonthRevenue = prevMonthSales.reduce((sum, s) => sum + s.totalAmount, 0);

    // Call Python Flask AI service
    let insights = [];
    try {
      const aiResponse = await axios.post("http://localhost:5001/business-insights", {
        monthRevenue,
        monthProfit,
        expenses: totalExpenses,
        prevMonthRevenue: prevMonthRevenue || monthRevenue
      });
      insights = aiResponse.data.data.insights;
    } catch (err) {
      console.warn("Could not connect to Flask AI Service, using fallback insights.");
      // Fallback insights
      const netProfit = monthProfit - totalExpenses;
      insights = [
        `📊 Gross Profit: ₹${monthProfit.toLocaleString("en-IN")}`,
        `🧾 Expenses: ₹${totalExpenses.toLocaleString("en-IN")}`,
        netProfit >= 0 
          ? `✅ Net Profit: ₹${netProfit.toLocaleString("en-IN")}. Keep it up!` 
          : `⚠️ Loss of ₹${Math.abs(netProfit).toLocaleString("en-IN")} this month. Reduce expenses!`
      ];
    }

    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const chatAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    const owner = req.ownerId;

    // Fetch products, recent sales, and recent expenses for context
    const [products, sales, expenses] = await Promise.all([
      Product.find({ owner, isActive: true }).select("productName category buyingPrice sellingPrice stockQuantity minStockLevel"),
      Sale.find({ owner }).sort({ saleDate: -1 }).limit(20).select("saleDate totalAmount items"),
      Expense.find({ owner }).sort({ date: -1 }).limit(20).select("expenseType amount")
    ]);

    // Send query along with store details to Flask AI service
    let reply = "";
    try {
      const aiResponse = await axios.post("http://localhost:5001/chat-advisor", {
        message,
        products,
        sales,
        expenses
      });
      reply = aiResponse.data.reply;
    } catch (err) {
      console.warn("Could not connect to Flask AI Service for chat advisor, using fallback response.");
      reply = `🤖 **SmartShop AI Assistant (Offline)**:\n\n` +
              `I'm currently unable to connect to the prediction engine. ` +
              `However, looking at your store database:\n` +
              `- You have **${products.length}** active products.\n` +
              `- You recorded **${sales.length}** recent sales bills.\n` +
              `- You recorded **${expenses.length}** recent expenses.\n\n` +
              `Please verify the Flask AI service is running on port 5001 to restore smart price trend check capabilities!`;
    }

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getProfitReport, getAIInsights, chatAssistant };
