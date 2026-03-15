// ============================================
//   Sales Page
//   Create bills, view sales history
// ============================================

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { salesAPI, productAPI, customerAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ---- New Sale Modal ----
const NewSaleModal = ({ onClose, onSaved }) => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [form, setForm] = useState({ customerId: "", customerName: "", paymentMode: "cash", discount: 0, notes: "" });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    productAPI.getAll().then((r) => setProducts(r.data.data));
    customerAPI.getAll().then((r) => setCustomers(r.data.data));
  }, []);

  const filteredProducts = products.filter((p) =>
    p.productName.toLowerCase().includes(productSearch.toLowerCase()) && p.stockQuantity > 0
  );

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId: product._id, productName: product.productName, sellingPrice: product.sellingPrice, buyingPrice: product.buyingPrice, quantity: 1, maxStock: product.stockQuantity }];
    });
  };

  const updateQty = (productId, qty) => {
    if (qty < 1) return removeFromCart(productId);
    setCartItems((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const total = cartItems.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const afterDiscount = total - Number(form.discount || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return toast.error("Add at least one product");
    setSaving(true);
    try {
      await salesAPI.create({
        ...form,
        items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paidAmount: form.paymentMode === "udhar" ? 0 : afterDiscount,
        discount: Number(form.discount || 0),
      });
      toast.success("Sale recorded! 🧾");
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Sale failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h3 className="modal-title">🧾 New Sale Bill</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Left: Product Search */}
              <div>
                <label className="form-label">Search & Add Products</label>
                <input className="form-control" placeholder="🔍 Type product name..." value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)} style={{ marginBottom: 8 }} />
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
                  {filteredProducts.slice(0, 20).map((p) => (
                    <div key={p._id} onClick={() => addToCart(p)}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{p.productName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Stock: {p.stockQuantity} {p.unit}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: "var(--primary)" }}>{rupee(p.sellingPrice)}</div>
                    </div>
                  ))}
                  {filteredProducts.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No products found</div>}
                </div>
              </div>

              {/* Right: Cart */}
              <div>
                <label className="form-label">Bill Items ({cartItems.length})</label>
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8, marginBottom: 8 }}>
                  {cartItems.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>No items added yet</div>}
                  {cartItems.map((item) => (
                    <div key={item.productId} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.productName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{rupee(item.sellingPrice)} × {item.quantity} = <strong>{rupee(item.sellingPrice * item.quantity)}</strong></div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateQty(item.productId, item.quantity - 1)} style={{ padding: "2px 8px" }}>−</button>
                        <span style={{ minWidth: 24, textAlign: "center", fontWeight: 700, fontSize: 13 }}>{item.quantity}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateQty(item.productId, item.quantity + 1)} style={{ padding: "2px 8px" }} disabled={item.quantity >= item.maxStock}>+</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.productId)} style={{ padding: "2px 8px" }}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Bill Summary */}
                <div style={{ background: "var(--bg-hover)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                    <span>{rupee(total)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-muted)" }}>Discount</span>
                    <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      style={{ width: 80, textAlign: "right", border: "1px solid var(--border)", borderRadius: 4, background: "var(--bg-card)", color: "var(--text-primary)", padding: "2px 6px", fontSize: 13 }} min="0" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 6, fontWeight: 700, fontSize: 15 }}>
                    <span>Total</span>
                    <span style={{ color: "var(--primary)" }}>{rupee(afterDiscount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Payment */}
            <div className="form-grid-2" style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Customer</label>
                <select
                  className="form-control"
                  value={form.customerId}
                  style={{ borderColor: form.paymentMode === "udhar" && !form.customerId ? "var(--danger)" : undefined }}
                  onChange={(e) => {
                    const selectedCustomer = customers.find(c => c._id === e.target.value);
                    setForm({ ...form, customerId: e.target.value, customerName: selectedCustomer ? selectedCustomer.name : "" });
                  }}
                >
                  <option value="">Walk-in Customer</option>
                  {customers.map((c) => <option key={c._id} value={c._id}>{c.name} {c.totalUdhar > 0 ? `(Udhar: ${rupee(c.totalUdhar)})` : ""}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select className="form-control" value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}>
                  <option value="cash">💵 Cash</option>
                  <option value="upi">📱 UPI</option>
                  <option value="card">💳 Card</option>
                  <option value="udhar">📒 Udhar (Credit)</option>
                  <option value="razorpay">🔐 Razorpay</option>
                </select>
              </div>
            </div>
            {form.paymentMode === "udhar" && !form.customerId && (
              <div className="alert alert-danger">
                🚨 You must select a customer for Udhar sales. Walk-in customers cannot have udhar.
              </div>
            )}
            {form.paymentMode === "udhar" && form.customerId && (
              <div className="alert alert-warning">
                ⚠️ Full amount of {rupee(afterDiscount)} will be added to {form.customerName}'s udhar balance.
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || cartItems.length === 0 || (form.paymentMode === "udhar" && !form.customerId)}>
              {saving ? <><span className="spinner" /> Processing...</> : `Create Bill ${rupee(afterDiscount)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Sales Page ----
const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await salesAPI.getAll();
      setSales(res.data.data);
    } catch (err) {
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex-between mb-4">
        <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Total {sales.length} sales recorded
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Sale</button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
            sales.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🧾</div><h3>No sales yet</h3></div> : (
              <table>
                <thead>
                  <tr>
                    <th>Bill No.</th><th>Customer</th><th>Items</th>
                    <th>Total</th><th>Paid</th><th>Due</th><th>Mode</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((s) => (
                    <tr key={s._id}>
                      <td><span style={{ fontWeight: 700, color: "var(--primary)" }}>{s.billNumber}</span></td>
                      <td>{s.customerName}</td>
                      <td>{s.items.length} item(s)</td>
                      <td style={{ fontWeight: 700 }}>{rupee(s.totalAmount)}</td>
                      <td style={{ color: "var(--success)", fontWeight: 600 }}>{rupee(s.paidAmount)}</td>
                      <td>
                        {s.dueAmount > 0
                          ? <span style={{ color: "var(--danger)", fontWeight: 600 }}>{rupee(s.dueAmount)}</span>
                          : <span className="badge badge-success">Paid</span>}
                      </td>
                      <td><span className="badge badge-primary">{s.paymentMode}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {new Date(s.saleDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {showModal && <NewSaleModal onClose={() => setShowModal(false)} onSaved={fetchSales} />}
    </div>
  );
};

export default SalesPage;
