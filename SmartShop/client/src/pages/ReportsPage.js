// ============================================
//   Reports & Analytics Page
// ============================================
import React, { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { reportAPI, expenseAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

const ReportsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  useEffect(() => {
    Promise.all([reportAPI.getDashboard(), reportAPI.getProfit()])
      .then(([d, p]) => { setDashboard(d.data.data); setProfit(p.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner spinner-primary" /></div>;

  const expenseData = [
    { name: "Gross Profit", value: dashboard?.month?.profit || 0 },
    { name: "Expenses", value: dashboard?.month?.expenses || 0 },
  ];

  return (
    <div>
      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          ["📊", "Monthly Revenue", rupee(dashboard?.month?.revenue), "blue"],
          ["💹", "Gross Profit", rupee(dashboard?.month?.profit), "green"],
          ["🧾", "Total Expenses", rupee(dashboard?.month?.expenses), "yellow"],
          ["✅", "Net Profit", rupee(dashboard?.month?.netProfit), "green"],
        ].map(([icon, label, val, color]) => (
          <div key={label} className="stat-card"><div className={`stat-icon ${color}`}>{icon}</div>
            <div className="stat-info"><div className="stat-label">{label}</div><div className="stat-value">{val}</div></div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* 7-day revenue/profit */}
        <div className="card">
          <div className="card-header"><span className="card-title">📈 Revenue & Profit (Last 7 Days)</span></div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dashboard?.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v) => rupee(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="profit" name="Profit" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit vs Expenses Pie */}
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Profit vs Expenses</span></div>
          <div className="card-body flex-center" style={{ flexDirection: "column" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={expenseData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                  {expenseData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => rupee(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12 }}>
              {expenseData.map((d, i) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS[i], display: "inline-block" }} />
                  <span style={{ color: "var(--text-secondary)" }}>{d.name}: <strong>{rupee(d.value)}</strong></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="card">
        <div className="card-header"><span className="card-title">🏆 Top Products by Profit</span></div>
        <div className="table-wrapper">
          {!profit?.productProfit?.length ? (
            <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No sales data yet</h3></div>
          ) : (
            <table>
              <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Total Profit</th><th>Avg Margin</th></tr></thead>
              <tbody>
                {profit.productProfit.slice(0, 10).map((p, i) => (
                  <tr key={p._id}>
                    <td><span style={{ fontWeight: 700, color: i < 3 ? "#f59e0b" : "var(--text-muted)" }}>#{i + 1}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.productName}</td>
                    <td>{p.totalSold}</td>
                    <td>{rupee(p.totalRevenue)}</td>
                    <td style={{ fontWeight: 700, color: "var(--success)" }}>{rupee(p.totalProfit)}</td>
                    <td><span style={{ color: p.avgMargin >= 15 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>{Number(p.avgMargin || 0).toFixed(1)}%</span></td>
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
export default ReportsPage;
