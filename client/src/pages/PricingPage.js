// ============================================
//   Dynamic Pricing Page
// ============================================
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { pricingAPI, productAPI } from "../services/api";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

const PricingPage = () => {
  const [alerts, setAlerts] = useState([]); const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]); const [selected, setSelected] = useState("");
  const [newBuyingPrice, setNewBuyingPrice] = useState(""); const [margin, setMargin] = useState(20);
  const [suggestion, setSuggestion] = useState(null); const [calculating, setCalculating] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    Promise.all([pricingAPI.getAlerts(), productAPI.getAll()])
      .then(([a, p]) => { setAlerts(a.data.data); setProducts(p.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const calculateSuggestion = async () => {
    if (!selected || !newBuyingPrice) return toast.error("Select product and enter new buying price");
    setCalculating(true); setSuggestion(null);
    try {
      const res = await pricingAPI.getSuggestion({ productId: selected, newBuyingPrice: Number(newBuyingPrice), targetMargin: Number(margin) });
      setSuggestion(res.data.data);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setCalculating(false); }
  };

  const applyPrice = async () => {
    if (!suggestion) return;
    setApplying(true);
    try {
      await pricingAPI.applyPrice(selected, { newSellingPrice: suggestion.suggestedSellingPrice, newBuyingPrice: Number(newBuyingPrice) });
      toast.success("Prices updated successfully! 🏷️");
      setSuggestion(null); setSelected(""); setNewBuyingPrice("");
    } catch { toast.error("Failed to apply price"); }
    finally { setApplying(false); }
  };

  return (
    <div>
      {/* Price Calculator */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header"><span className="card-title">🏷️ Dynamic Price Calculator</span></div>
        <div className="card-body">
          <div className="form-grid-3">
            <div className="form-group"><label className="form-label">Select Product *</label>
              <select className="form-control" value={selected} onChange={(e) => { setSelected(e.target.value); setSuggestion(null); }}>
                <option value="">-- Choose Product --</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.productName} (Buy: {rupee(p.buyingPrice)}, Sell: {rupee(p.sellingPrice)})</option>)}
              </select>
            </div>
            <div className="form-group"><label className="form-label">New Buying Price (₹) *</label>
              <input type="number" className="form-control" placeholder="New market rate" value={newBuyingPrice} onChange={(e) => { setNewBuyingPrice(e.target.value); setSuggestion(null); }} />
            </div>
            <div className="form-group"><label className="form-label">Target Profit Margin (%)</label>
              <input type="number" className="form-control" value={margin} onChange={(e) => setMargin(e.target.value)} min="0" max="100" />
            </div>
          </div>
          <button className="btn btn-primary" onClick={calculateSuggestion} disabled={calculating}>
            {calculating ? <><span className="spinner" /> Calculating...</> : "🧮 Calculate Suggested Price"}
          </button>

          {suggestion && (
            <div style={{ marginTop: 20 }}>
              {suggestion.isLossMaking && <div className="alert alert-danger">🚨 {suggestion.message}</div>}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  ["Old Buy Price", rupee(suggestion.currentBuyingPrice), "var(--text-muted)"],
                  ["New Buy Price", rupee(suggestion.newBuyingPrice), "var(--warning)"],
                  ["Current Sell", rupee(suggestion.currentSellingPrice), "var(--text-secondary)"],
                  ["Suggested Sell", rupee(suggestion.suggestedSellingPrice), "var(--primary)"],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: "var(--bg-hover)", padding: 14, borderRadius: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div className={`alert ${suggestion.isLossMaking ? "alert-danger" : "alert-success"}`}>
                  {suggestion.message}
                </div>
                <button className="btn btn-success" onClick={applyPrice} disabled={applying} style={{ marginRight: 8 }}>
                  {applying ? "Applying..." : "✅ Apply Suggested Price"}
                </button>
                <button className="btn btn-ghost" onClick={() => setSuggestion(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Price Changes */}
      <div className="card">
        <div className="card-header"><span className="card-title">📋 Recent Price Changes</span></div>
        <div className="table-wrapper">
          {loading ? <div className="loading-screen"><div className="spinner spinner-primary" /></div> :
            alerts.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🏷️</div><h3>No price changes yet</h3></div> : (
              <table><thead><tr><th>Product</th><th>Old Buy</th><th>New Buy</th><th>Old Sell</th><th>Suggested Sell</th><th>Date</th></tr></thead>
                <tbody>
                  {alerts.map(a => (
                    <tr key={a._id}>
                      <td style={{ fontWeight: 600 }}>{a.productId?.productName || "—"}</td>
                      <td>{rupee(a.oldBuyingPrice)}</td>
                      <td style={{ color: a.newBuyingPrice > a.oldBuyingPrice ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>{rupee(a.newBuyingPrice)} {a.newBuyingPrice > a.oldBuyingPrice ? "↑" : "↓"}</td>
                      <td>{rupee(a.oldSellingPrice)}</td>
                      <td style={{ color: "var(--primary)", fontWeight: 700 }}>{rupee(a.suggestedSellingPrice)}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{new Date(a.changeDate).toLocaleDateString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
};
export default PricingPage;
