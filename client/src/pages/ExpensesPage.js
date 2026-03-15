// ============================================
//   Expenses Page
// ============================================
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { expenseAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const EXPENSE_TYPES = ["rent", "electricity", "salary", "transport", "maintenance", "marketing", "other"];
const EXPENSE_ICONS = { rent: "🏠", electricity: "⚡", salary: "👷", transport: "🚛", maintenance: "🔧", marketing: "📢", other: "📝" };

const ExpenseModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ expenseType: "rent", customLabel: "", amount: "", date: new Date().toISOString().split("T")[0], paymentMode: "cash", note: "" });
  const [saving, setSaving] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await expenseAPI.create(form); toast.success("Expense recorded!"); onSaved(); onClose(); }
    catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">💰 Add Expense</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Expense Type *</label>
                <select name="expenseType" className="form-control" value={form.expenseType} onChange={handleChange}>
                  {EXPENSE_TYPES.map(t => <option key={t} value={t}>{EXPENSE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Amount (₹) *</label>
                <input name="amount" type="number" className="form-control" value={form.amount} onChange={handleChange} required min="0" />
              </div>
              <div className="form-group"><label className="form-label">Date *</label>
                <input name="date" type="date" className="form-control" value={form.date} onChange={handleChange} required />
              </div>
              <div className="form-group"><label className="form-label">Payment Mode</label>
                <select name="paymentMode" className="form-control" value={form.paymentMode} onChange={handleChange}>
                  <option value="cash">💵 Cash</option><option value="upi">📱 UPI</option>
                  <option value="bank_transfer">🏦 Bank</option><option value="card">💳 Card</option>
                </select>
              </div>
            </div>
            {form.expenseType === "other" && (
              <div className="form-group"><label className="form-label">Custom Label</label>
                <input name="customLabel" className="form-control" value={form.customLabel} onChange={handleChange} placeholder="Describe this expense" />
              </div>
            )}
            <div className="form-group"><label className="form-label">Note</label>
              <input name="note" className="form-control" value={form.note} onChange={handleChange} placeholder="Optional details" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Add Expense"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [total, setTotal] = useState(0);
  useEffect(() => { fetchExpenses(); }, []);
  const fetchExpenses = async () => {
    setLoading(true);
    try { const res = await expenseAPI.getAll(); setExpenses(res.data.data); setTotal(res.data.total); }
    catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try { await expenseAPI.delete(id); toast.success("Deleted"); fetchExpenses(); }
    catch { toast.error("Failed"); }
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="stat-card"><div className="stat-icon yellow">💸</div><div className="stat-info"><div className="stat-label">Total Expenses</div><div className="stat-value">{rupee(total)}</div></div></div>
        <div className="stat-card"><div className="stat-icon blue">📋</div><div className="stat-info"><div className="stat-label">Total Records</div><div className="stat-value">{expenses.length}</div></div></div>
        <div className="stat-card"><div className="stat-icon red">📅</div><div className="stat-info"><div className="stat-label">Avg per Expense</div><div className="stat-value">{expenses.length ? rupee(Math.round(total / expenses.length)) : "₹0"}</div></div></div>
      </div>
      <div className="flex-between mb-4">
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>All expenses</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
      </div>
      <div className="card"><div className="table-wrapper">
        {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
          expenses.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💰</div><h3>No expenses recorded</h3></div> : (
            <table><thead><tr><th>Type</th><th>Amount</th><th>Mode</th><th>Note</th><th>Date</th><th>Action</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e._id}>
                    <td><span style={{ fontWeight: 600 }}>{EXPENSE_ICONS[e.expenseType]} {e.customLabel || e.expenseType}</span></td>
                    <td style={{ fontWeight: 700, color: "var(--danger)" }}>{rupee(e.amount)}</td>
                    <td><span className="badge badge-primary">{e.paymentMode}</span></td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{e.note || "—"}</td>
                    <td style={{ fontSize: 12 }}>{new Date(e.date).toLocaleDateString("en-IN")}</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => handleDelete(e._id)}>🗑️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div></div>
      {showModal && <ExpenseModal onClose={() => setShowModal(false)} onSaved={fetchExpenses} />}
    </div>
  );
};
export default ExpensesPage;
