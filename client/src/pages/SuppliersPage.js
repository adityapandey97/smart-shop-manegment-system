import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { supplierAPI } from "../services/api";

const SupplierModal = ({ supplier, onClose, onSaved }) => {
  const isEdit = !!supplier?._id;
  const [form, setForm] = useState({ supplierName: supplier?.supplierName || "", phone: supplier?.phone || "", email: supplier?.email || "", address: supplier?.address || "", notes: supplier?.notes || "" });
  const [saving, setSaving] = useState(false);
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (isEdit) { await supplierAPI.update(supplier._id, form); toast.success("Supplier updated!"); }
      else { await supplierAPI.create(form); toast.success("Supplier added! 🏭"); }
      onSaved(); onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  };
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">{isEdit ? "Edit Supplier" : "Add Supplier"}</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Supplier Name *</label><input name="supplierName" className="form-control" value={form.supplierName} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Phone *</label><input name="phone" className="form-control" value={form.phone} onChange={handleChange} required /></div>
            <div className="form-group"><label className="form-label">Email</label><input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} /></div>
            <div className="form-group"><label className="form-label">Address</label><textarea name="address" className="form-control" value={form.address} onChange={handleChange} rows={2} /></div>
            <div className="form-group"><label className="form-label">Notes</label><input name="notes" className="form-control" value={form.notes} onChange={handleChange} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update" : "Add Supplier"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false); const [editSupplier, setEditSupplier] = useState(null);
  useEffect(() => { fetchSuppliers(); }, []);
  const fetchSuppliers = async () => {
    setLoading(true);
    try { const res = await supplierAPI.getAll(); setSuppliers(res.data.data); }
    catch { toast.error("Failed to load suppliers"); }
    finally { setLoading(false); }
  };
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove supplier "${name}"?`)) return;
    try { await supplierAPI.delete(id); toast.success("Supplier removed"); fetchSuppliers(); }
    catch { toast.error("Delete failed"); }
  };
  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{suppliers.length} suppliers</div>
        <button className="btn btn-primary" onClick={() => { setEditSupplier(null); setShowModal(true); }}>+ Add Supplier</button>
      </div>
      <div className="card"><div className="table-wrapper">
        {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
          suppliers.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏭</div><h3>No suppliers yet</h3></div> : (
            <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Address</th><th>Rating</th><th>Actions</th></tr></thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s._id}>
                    <td><div style={{ fontWeight: 600 }}>{s.supplierName}</div></td>
                    <td>{s.phone}</td>
                    <td>{s.email || "—"}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.address || "—"}</td>
                    <td>{"⭐".repeat(s.rating || 3)}</td>
                    <td><div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditSupplier(s); setShowModal(true); }}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s._id, s.supplierName)}>🗑️</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div></div>
      {showModal && <SupplierModal supplier={editSupplier} onClose={() => setShowModal(false)} onSaved={fetchSuppliers} />}
    </div>
  );
};
export default SuppliersPage;
