const express = require("express");
const router = express.Router();
const { getExpenses, createExpense, deleteExpense } = require("../controllers/expenseController");
const { protect, setOwnerFilter, managerOrOwner, ownerOnly } = require("../middleware/authMiddleware");

router.route("/").get(protect, setOwnerFilter, getExpenses).post(protect, setOwnerFilter, managerOrOwner, createExpense);
router.delete("/:id", protect, setOwnerFilter, ownerOnly, deleteExpense);

module.exports = router;
