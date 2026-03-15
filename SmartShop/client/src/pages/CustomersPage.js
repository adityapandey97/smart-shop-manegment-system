import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { customerAPI } from "../services/api";
const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const riskColors = { low: "badge-success", medium: "badge-warning", high: "badge-danger" };

const CustomerModal = ({ customer, onClose, onSaved }) => {
  const isEdit = !!customer?._id;
  const [form, setForm] = useState({ name: customer?.name || "", phone: customer?.phone || "", email: customer?.email || "", address: customer?.address || "", notes: customer?.notes || "" });
  const [saving, setSaving] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (isEdit) { await customerAPI.update(customer._id, form); toast.success("Customer updated!"); }
      else { await customerAPI.create(form); toast.success("Customer added! 👥"); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">{isEdit ? "Edit Customer" : "Add Customer"}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Full Name *</label><input name="name" className="form-control" value={form.name} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Phone *</label><input name="phone" className="form-control" value={form.phone} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Address</label><textarea name="address" className="form-control" value={form.address} onChange={handleChange} rows={2} /></div>
            <div className="form-group"><label className="form-label">Notes</label><input name="notes" className="form-control" value={form.notes} onChange={handleChange} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update" : "Add Customer"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editCustomer, setEditCustomer] = useState(null);
  const [search, setSearch] = useState(""); const [riskFilter, setRiskFilter] = useState("all");
  useEffect(() => { fetchCustomers(); }, []);
  const fetchCustomers = async () => {
    setLoading(true);
    try { const res = await customerAPI.getAll(); setCustomers(res.data.data); }
    catch { toast.error("Failed to load customers"); }
    finally { setLoading(false); }
  };
  const filtered = customers.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    return riskFilter === "all" ? matchSearch : matchSearch && c.riskLevel === riskFilter;
  });
  return (
    <div>
      <div className="flex-between mb-4">
        <div className="flex gap-2">
          <input className="form-control" placeholder="🔍 Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 240 }} />
          {["all", "low", "medium", "high"].map(r => (
            <button key={r} className={`btn btn-sm ${riskFilter === r ? "btn-primary" : "btn-ghost"}`} onClick={() => setRiskFilter(r)}>
              {r === "all" ? "All" : r === "high" ? "🚨 High Risk" : r === "medium" ? "⚠️ Medium" : "✅ Low Risk"}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => { setEditCustomer(null); setShowModal(true); }}>+ Add Customer</button>
      </div>
      <div className="card"><div className="table-wrapper">
        {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
          filtered.length === 0 ? <div className="empty-state"><div className="empty-state-icon">👥</div><h3>No customers found</h3></div> : (
            <table><thead><tr><th>Name</th><th>Phone</th><th>Total Udhar</th><th>Risk Level</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c._id}>
                    <td><div style={{ fontWeight: 600 }}>{c.name}</div>{c.address && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{c.address}</div>}</td>
                    <td>{c.phone}</td>
                    <td style={{ fontWeight: 700, color: c.totalUdhar > 0 ? "var(--danger)" : "var(--success)" }}>{rupee(c.totalUdhar)}</td>
                    <td><span className={`badge ${riskColors[c.riskLevel]}`}>{c.riskLevel} risk</span></td>
                    <td><button className="btn btn-ghost btn-sm" onClick={() => { setEditCustomer(c); setShowModal(true); }}>✏️ Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div></div>
      {showModal && <CustomerModal customer={editCustomer} onClose={() => setShowModal(false)} onSaved={fetchCustomers} />}
    </div>
  );
};
export default CustomersPage;
