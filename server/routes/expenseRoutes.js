const express = require("express");
const router = express.Router();
const { getExpenses, createExpense, deleteExpense } = require("../controllers/expenseController");
const { protect, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.route("/").get(protect, getExpenses).post(protect, managerOrOwner, createExpense);
router.delete("/:id", protect, ownerOnly, deleteExpense);

module.exports = router;
