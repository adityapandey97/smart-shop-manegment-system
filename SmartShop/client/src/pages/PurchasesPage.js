// ============================================
//   Purchases Page
// ============================================
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { purchaseAPI, productAPI, supplierAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const PurchaseModal = ({ onClose, onSaved }) => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ productId: "", supplierId: "", quantity: "", buyingPrice: "", paymentStatus: "paid", notes: "" });
  const [saving, setSaving] = useState(false);
  const [priceAlert, setPriceAlert] = useState(null);

  useEffect(() => {
    productAPI.getAll().then(r => setProducts(r.data.data));
    supplierAPI.getAll().then(r => setSuppliers(r.data.data));
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await purchaseAPI.create(form);
      if (res.data.priceAlert) setPriceAlert(res.data.priceAlert);
      else { toast.success("Purchase recorded! Stock updated 📦"); onSaved(); onClose(); }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  if (priceAlert) return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">💡 Price Changed!</h3></div>
        <div className="modal-body">
          <div className="alert alert-warning">{priceAlert.message}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[["Old Buy Price", priceAlert.oldBuyingPrice], ["New Buy Price", priceAlert.newBuyingPrice], ["Old Sell Price", priceAlert.oldSellingPrice], ["Suggested Sell Price", priceAlert.suggestedSellingPrice]].map(([label, val]) => (
              <div key={label} style={{ background: "var(--bg-hover)", padding: 12, borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--primary)" }}>{rupee(val)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={() => { onSaved(); onClose(); }}>Ignore for now</button>
          <button className="btn btn-primary" onClick={() => { onSaved(); onClose(); }}>Go to Pricing →</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3 className="modal-title">🛒 Record Purchase</h3><button className="icon-btn" onClick={onClose}>✕</button></div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group"><label className="form-label">Product *</label>
              <select name="productId" className="form-control" value={form.productId} onChange={handleChange} required>
                <option value="">-- Select Product --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.productName} (Stock: {p.stockQuantity})</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">Supplier</label>
              <select name="supplierId" className="form-control" value={form.supplierId} onChange={handleChange}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map(s => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
              </select>
            </div>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Quantity *</label>
                <input name="quantity" type="number" className="form-control" value={form.quantity} onChange={handleChange} required min="1" />
              </div>
              <div className="form-group"><label className="form-label">Buying Price (₹) *</label>
                <input name="buyingPrice" type="number" className="form-control" value={form.buyingPrice} onChange={handleChange} required min="0" step="0.01" />
              </div>
            </div>
            {form.quantity && form.buyingPrice && (
              <div className="alert alert-info">Total Cost: <strong>{rupee(form.quantity * form.buyingPrice)}</strong></div>
            )}
            <div className="form-group"><label className="form-label">Payment Status</label>
              <select name="paymentStatus" className="form-control" value={form.paymentStatus} onChange={handleChange}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
            </div>
            <div className="form-group"><label className="form-label">Notes</label>
              <input name="notes" className="form-control" value={form.notes} onChange={handleChange} placeholder="Optional" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Record Purchase"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState([]); const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  useEffect(() => { fetchPurchases(); }, []);
  const fetchPurchases = async () => {
    setLoading(true);
    try { const res = await purchaseAPI.getAll(); setPurchases(res.data.data); }
    catch { toast.error("Failed"); } finally { setLoading(false); }
  };
  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{purchases.length} purchases recorded</div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Record Purchase</button>
      </div>
      <div className="card"><div className="table-wrapper">
        {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
          purchases.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🛒</div><h3>No purchases yet</h3></div> : (
            <table><thead><tr><th>Product</th><th>Supplier</th><th>Qty</th><th>Buy Price</th><th>Total Cost</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {purchases.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.productId?.productName || "—"}</td>
                    <td>{p.supplierId?.supplierName || "—"}</td>
                    <td>{p.quantity}</td>
                    <td>{rupee(p.buyingPrice)}</td>
                    <td style={{ fontWeight: 700 }}>{rupee(p.totalCost)}</td>
                    <td><span className={`badge ${p.paymentStatus === "paid" ? "badge-success" : p.paymentStatus === "pending" ? "badge-danger" : "badge-warning"}`}>{p.paymentStatus}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(p.purchaseDate).toLocaleDateString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div></div>
      {showModal && <PurchaseModal onClose={() => setShowModal(false)} onSaved={fetchPurchases} />}
    </div>
  );
};
export default PurchasesPage;
