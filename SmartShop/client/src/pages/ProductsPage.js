// ============================================
//   Products Page
//   View, add, edit, delete products
// ============================================

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { productAPI, supplierAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

// ---- Add/Edit Product Modal ----
const ProductModal = ({ product, suppliers, onClose, onSaved }) => {
  const isEdit = !!product?._id;
  const [form, setForm] = useState({
    productName: product?.productName || "",
    category: product?.category || "",
    sku: product?.sku || "",
    unit: product?.unit || "piece",
    stockQuantity: product?.stockQuantity || 0,
    minStockLevel: product?.minStockLevel || 5,
    buyingPrice: product?.buyingPrice || "",
    sellingPrice: product?.sellingPrice || "",
    mrp: product?.mrp || "",
    supplierId: product?.supplierId?._id || "",
    expiryDate: product?.expiryDate ? product.expiryDate.split("T")[0] : "",
    barcode: product?.barcode || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Auto-suggest selling price when buying price is entered
  const handleBuyingPriceChange = (e) => {
    const bp = parseFloat(e.target.value);
    setForm((prev) => ({
      ...prev,
      buyingPrice: e.target.value,
      // Suggest 20% margin if selling price not yet set
      sellingPrice: !prev.sellingPrice && bp ? Math.ceil(bp * 1.2) : prev.sellingPrice,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await productAPI.update(product._id, form);
        toast.success("Product updated!");
      } else {
        await productAPI.create(form);
        toast.success("Product added! 📦");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? "✏️ Edit Product" : "📦 Add New Product"}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input name="productName" className="form-control" placeholder="e.g. Amul Butter 500g"
                  value={form.productName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <input name="category" className="form-control" placeholder="e.g. Dairy, Snacks"
                  value={form.category} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Buying Price (₹) *</label>
                <input name="buyingPrice" type="number" className="form-control" placeholder="Cost price"
                  value={form.buyingPrice} onChange={handleBuyingPriceChange} required min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">Selling Price (₹) *</label>
                <input name="sellingPrice" type="number" className="form-control" placeholder="Sale price"
                  value={form.sellingPrice} onChange={handleChange} required min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label">MRP (₹)</label>
                <input name="mrp" type="number" className="form-control" placeholder="Printed MRP"
                  value={form.mrp} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select name="unit" className="form-control" value={form.unit} onChange={handleChange}>
                  {["piece", "kg", "gram", "litre", "ml", "packet", "box", "dozen", "pair"].map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Stock Quantity</label>
                <input name="stockQuantity" type="number" className="form-control"
                  value={form.stockQuantity} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Min Stock Level (Alert below this)</label>
                <input name="minStockLevel" type="number" className="form-control"
                  value={form.minStockLevel} onChange={handleChange} min="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Supplier</label>
                <select name="supplierId" className="form-control" value={form.supplierId} onChange={handleChange}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map((s) => <option key={s._id} value={s._id}>{s.supplierName}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">SKU / Product Code</label>
                <input name="sku" className="form-control" placeholder="Optional unique code"
                  value={form.sku} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Expiry Date (if applicable)</label>
                <input name="expiryDate" type="date" className="form-control"
                  value={form.expiryDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Barcode</label>
                <input name="barcode" className="form-control" placeholder="Optional"
                  value={form.barcode} onChange={handleChange} />
              </div>
            </div>

            {/* Profit preview */}
            {form.buyingPrice && form.sellingPrice && (
              <div className={`alert ${form.sellingPrice > form.buyingPrice ? "alert-success" : "alert-danger"}`}>
                {form.sellingPrice > form.buyingPrice
                  ? `✅ Profit per unit: ₹${(form.sellingPrice - form.buyingPrice).toFixed(2)} (${(((form.sellingPrice - form.buyingPrice) / form.buyingPrice) * 100).toFixed(1)}% margin)`
                  : `⚠️ Warning: Selling price is less than buying price! You'll LOSE money.`}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : isEdit ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Products Page ----
const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all | lowStock | deadStock
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([productAPI.getAll(), supplierAPI.getAll()]);
      setProducts(pRes.data.data);
      setSuppliers(sRes.data.data);
    } catch (err) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from products?`)) return;
    try {
      await productAPI.delete(id);
      toast.success("Product removed");
      fetchAll();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  // Filter products
  const filtered = products.filter((p) => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    if (filter === "lowStock") return matchSearch && p.isLowStock;
    if (filter === "deadStock") return matchSearch && p.isDeadStock;
    return matchSearch;
  });

  return (
    <div>
      {/* Top Bar */}
      <div className="flex-between mb-4">
        <div className="flex gap-2">
          <input
            className="form-control" placeholder="🔍 Search products..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          {["all", "lowStock", "deadStock"].map((f) => (
            <button key={f} className={`btn ${filter === f ? "btn-primary" : "btn-ghost"} btn-sm`}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f === "lowStock" ? "⚠️ Low Stock" : "🪦 Dead Stock"}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => { setEditProduct(null); setShowModal(true); }}>
          + Add Product
        </button>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-screen"><div className="spinner spinner-primary" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <h3>No products found</h3>
              <p>Add your first product to get started</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Buy Price</th>
                  <th>Sell Price</th>
                  <th>Margin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const margin = p.buyingPrice ? (((p.sellingPrice - p.buyingPrice) / p.buyingPrice) * 100).toFixed(1) : 0;
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.productName}</div>
                        {p.sku && <div style={{ fontSize: 11, color: "var(--text-muted)" }}>SKU: {p.sku}</div>}
                      </td>
                      <td><span className="badge badge-primary">{p.category}</span></td>
                      <td>
                        <span style={{ fontWeight: 700, color: p.isLowStock ? "var(--danger)" : "var(--text-primary)" }}>
                          {p.stockQuantity}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}> {p.unit}</span>
                      </td>
                      <td>{rupee(p.buyingPrice)}</td>
                      <td>{rupee(p.sellingPrice)}</td>
                      <td>
                        <span style={{ color: margin >= 15 ? "var(--success)" : margin >= 0 ? "var(--warning)" : "var(--danger)", fontWeight: 600 }}>
                          {margin}%
                        </span>
                      </td>
                      <td>
                        {p.isLowStock && <span className="badge badge-danger">Low Stock</span>}
                        {p.isDeadStock && <span className="badge badge-warning" style={{ marginLeft: 4 }}>Dead Stock</span>}
                        {!p.isLowStock && !p.isDeadStock && <span className="badge badge-success">Good</span>}
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditProduct(p); setShowModal(true); }}>✏️</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id, p.productName)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ProductModal
          product={editProduct}
          suppliers={suppliers}
          onClose={() => setShowModal(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default ProductsPage;
