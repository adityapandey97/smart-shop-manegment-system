// ============================================
//   Expense Controller — with owner isolation
// ============================================
const { Expense } = require("../models/OtherModels");

const getExpenses = async (req, res) => {
  try {
    const filter = { owner: req.ownerId };
    if (req.query.type) filter.expenseType = req.query.type;
    if (req.query.month) {
      const [year, month] = req.query.month.split("-");
      filter.date = { $gte: new Date(year, month - 1, 1), $lt: new Date(year, month, 1) };
    }
    const expenses = await Expense.find(filter).populate("addedBy", "name").sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    res.json({ success: true, total: totalAmount, count: expenses.length, data: expenses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, addedBy: req.user._id, owner: req.ownerId });
    res.status(201).json({ success: true, message: "Expense recorded!", data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    await Expense.findOneAndDelete({ _id: req.params.id, owner: req.ownerId });
    res.json({ success: true, message: "Expense deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExpenses, createExpense, deleteExpense };
