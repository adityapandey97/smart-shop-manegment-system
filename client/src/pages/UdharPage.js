// ============================================
//   Udhar (Credit) Ledger Page
// ============================================
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { udharAPI, customerAPI } from "../services/api";
import { UdharIcon, CustomersIcon, AlertIcon, AIIcon, EmailIcon, WhatsAppIcon } from "../components/layout/Icons";

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

// ---- AI Customer Risk Analysis Modal ----
const CustomerRiskModal = ({ customer, onClose }) => {
  const [riskData, setRiskData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.analyzeRisk(customer._id)
      .then(res => setRiskData(res.data.data))
      .catch(() => {
        toast.error("Forecasting service down");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [customer]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <AIIcon style={{ color: "var(--primary)" }} /> AI Credit Risk Advisor
          </h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div className="spinner spinner-primary" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-secondary)" }}>Analyzing payment history & risk parameters...</p>
          </div>
        ) : (
          <div className="modal-body">
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.8 }}>Risk Score</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: riskData.riskLevel === "high" ? "var(--danger)" : riskData.riskLevel === "medium" ? "var(--warning)" : "var(--success)", margin: "4px 0" }}>
                {riskData.riskScore} / 100
              </div>
              <span className="badge" style={{
                background: riskData.riskLevel === "high" ? "rgba(239, 68, 68, 0.15)" : riskData.riskLevel === "medium" ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: riskData.riskLevel === "high" ? "var(--danger)" : riskData.riskLevel === "medium" ? "var(--warning)" : "var(--success)",
                fontWeight: 700, textTransform: "capitalize", fontSize: 13, padding: "6px 14px", borderRadius: 20
              }}>
                {riskData.riskLevel} Risk
              </span>
            </div>

            <div className="alert alert-info" style={{ marginBottom: 20 }}>
              Customer: <strong>{customer.name}</strong><br/>
              Pending Balance: <strong>{rupee(customer.totalUdhar)}</strong><br/>
              Delays Counted: <strong>{customer.delayCount || 0} times</strong>
            </div>

            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                🤖 AI Smart Advice
              </h4>
              <p style={{ margin: 0, fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                {riskData.advice}
              </p>
            </div>
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Close Report</button>
        </div>
      </div>
    </div>
  );
};

const UdharPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [riskCustomer, setRiskCustomer] = useState(null);
  const [totalPending, setTotalPending] = useState(0);

  useEffect(() => { fetchPending(); }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await udharAPI.getPending();
      setCustomers(res.data.data);
      setTotalPending(res.data.totalPending);
    } catch {
      toast.error("Failed to load credit ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (customerId, type) => {
    const loadingToast = toast.loading(`Sending ${type} reminder...`);
    try {
      const res = await udharAPI.sendReminder({ customerId, type });
      toast.success(res.data.message || "Reminder sent!", { id: loadingToast });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder", { id: loadingToast });
    }
  };

  const riskColors = { low: "#16a34a", medium: "#d97706", high: "#dc2626" };

  return (
    <div>
      {/* Visual Header Banner */}
      <div className="dashboard-banner" style={{
        backgroundImage: "linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(220, 38, 38, 0.35)), url('https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=1000')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "48px 36px",
        borderRadius: "var(--border-radius)",
        color: "#fff",
        marginBottom: "24px",
        boxShadow: "var(--shadow-md)"
      }}>
        <span className="brand-pill" style={{ background: "rgba(255, 255, 255, 0.2)", color: "#fff", marginBottom: 12 }}>Finance Control</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, margin: "6px 0 10px", letterSpacing: "-0.5px" }}>Udhar Credit Ledger</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", maxWidth: 500, lineHeight: 1.6 }}>
          Manage customer lines of credit, monitor billing delays, verify AI credit risk profiles, and dispatch notifications via Email or SMS/WhatsApp.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><UdharIcon /></div>
          <div className="stat-info">
            <div className="stat-label">Total Pending Udhar</div>
            <div className="stat-value">{rupee(totalPending)}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><CustomersIcon /></div>
          <div className="stat-info">
            <div className="stat-label">Customers with Udhar</div>
            <div className="stat-value">{customers.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertIcon /></div>
          <div className="stat-info">
            <div className="stat-label">High Risk Customers</div>
            <div className="stat-value">{customers.filter(c => c.riskLevel === "high").length}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">📒 Udhar Ledger Table</span></div>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
            customers.length === 0 ? (
              <div className="empty-state" style={{ padding: "48px 24px" }}>
                <UdharIcon style={{ width: 48, height: 48, strokeWidth: 1.5, marginBottom: 16, color: "var(--text-muted)" }} />
                <h3>No pending udhars!</h3>
                <p>All customers are clear.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Phone</th>
                    <th>Pending Udhar</th>
                    <th>Risk Factor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        {c.email && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.email}</div>}
                      </td>
                      <td>{c.phone}</td>
                      <td><span style={{ fontWeight: 800, fontSize: 16, color: "var(--danger)" }}>{rupee(c.totalUdhar)}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: riskColors[c.riskLevel], textTransform: "capitalize" }}>
                          {c.riskLevel}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                          <button className="btn btn-success btn-sm" onClick={() => setSelectedCustomer(c)} style={{ padding: "4px 8px" }}>💳 Pay</button>
                          <button className="btn btn-primary btn-sm" onClick={() => setRiskCustomer(c)} style={{ padding: "4px 8px", background: "var(--primary-bg)", color: "var(--primary)", borderColor: "var(--primary)" }}>🤖 AI Risk</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleSendReminder(c._id, "email")} disabled={!c.email} title={!c.email ? "No email provided" : "Send email invoice"} style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                            <EmailIcon style={{ width: 14, height: 14 }} /> Email
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => handleSendReminder(c._id, "whatsapp")} style={{ padding: "4px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                            <WhatsAppIcon style={{ width: 14, height: 14 }} /> WhatsApp
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {selectedCustomer && <PaymentModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onSaved={fetchPending} />}
      {riskCustomer && <CustomerRiskModal customer={riskCustomer} onClose={() => setRiskCustomer(null)} />}
    </div>
  );
};

export default UdharPage;
