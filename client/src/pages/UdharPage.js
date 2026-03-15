// ============================================
//   Udhar (Credit) Ledger Page
// ============================================
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { udharAPI, customerAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const PaymentModal = ({ customer, onClose, onSaved }) => {
  const [form, setForm] = useState({ paidAmount: "", paymentMode: "cash", notes: "" });
  const [saving, setSaving] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await udharAPI.recordPayment({ customerId: customer._id, paidAmount: Number(form.paidAmount), paymentMode: form.paymentMode, notes: form.notes });
      toast.success(`Payment of ${rupee(form.paidAmount)} recorded! ✅`);
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">💳 Record Payment</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="alert alert-info">
              Customer: <strong>{customer.name}</strong> | Total Udhar: <strong>{rupee(customer.totalUdhar)}</strong>
            </div>
            <div className="form-group"><label className="form-label">Payment Amount (₹) *</label>
              <input name="paidAmount" type="number" className="form-control" placeholder="How much is paying?"
                value={form.paidAmount} onChange={handleChange} required min="1" max={customer.totalUdhar} />
            </div>
            <div className="form-group"><label className="form-label">Payment Mode</label>
              <select name="paymentMode" className="form-control" value={form.paymentMode} onChange={handleChange}>
                <option value="cash">💵 Cash</option><option value="upi">📱 UPI</option>
                <option value="card">💳 Card</option><option value="bank_transfer">🏦 Bank Transfer</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Notes</label>
              <input name="notes" className="form-control" value={form.notes} onChange={handleChange} placeholder="Optional" />
            </div>
            {form.paidAmount && (
              <div className="alert alert-success">
                Remaining after payment: <strong>{rupee(customer.totalUdhar - form.paidAmount)}</strong>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Processing..." : "Record Payment ✅"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UdharPage = () => {
  const [customers, setCustomers] = useState([]); const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null); const [totalPending, setTotalPending] = useState(0);
  useEffect(() => { fetchPending(); }, []);
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await udharAPI.getPending();
      setCustomers(res.data.data); setTotalPending(res.data.totalPending);
    } catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  const riskColors = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        {[["💳", "Total Pending Udhar", rupee(totalPending), "blue"], ["👥", "Customers with Udhar", customers.length, "yellow"], ["🚨", "High Risk Customers", customers.filter(c => c.riskLevel === "high").length, "red"]].map(([icon, label, val, color]) => (
          <div key={label} className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div><div className="stat-info"><div className="stat-label">{label}</div><div className="stat-value">{val}</div></div></div>
        ))}
      </div>
      <div className="card"><div className="card-header"><span className="card-title">📒 Udhar Ledger</span></div>
        <div className="table-wrapper">
          {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
            customers.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🎉</div><h3>No pending udhars!</h3><p>All customers are clear.</p></div> : (
              <table><thead><tr><th>Customer</th><th>Phone</th><th>Pending Udhar</th><th>Risk</th><th>Action</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c._id}>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td>{c.phone}</td>
                      <td><span style={{ fontWeight: 800, fontSize: 16, color: "var(--danger)" }}>{rupee(c.totalUdhar)}</span></td>
                      <td><span style={{ fontWeight: 700, color: riskColors[c.riskLevel], textTransform: "capitalize" }}>
                        {c.riskLevel === "high" ? "🚨" : c.riskLevel === "medium" ? "⚠️" : "✅"} {c.riskLevel}
                      </span></td>
                      <td><button className="btn btn-success btn-sm" onClick={() => setSelectedCustomer(c)}>💳 Record Payment</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
      {selectedCustomer && <PaymentModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSaved={fetchPending} />}
    </div>
  );
};
export default UdharPage;
