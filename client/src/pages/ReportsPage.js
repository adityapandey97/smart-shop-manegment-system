// ============================================
//   Reports & Analytics Page
// ============================================
import React, { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { reportAPI, expenseAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { ReportsIcon, PricingIcon, ExpensesIcon, AIIcon, ProductsIcon } from "../components/layout/Icons";

const rupee = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;
const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#06b6d4"];

const ReportsPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [profit, setProfit] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isDark } = useTheme();
  const gridColor = isDark ? "#2d3748" : "#e2e8f0";

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
      {/* Visual Header Banner */}
      <div className="dashboard-banner" style={{
        backgroundImage: "linear-gradient(to right, rgba(15, 23, 42, 0.95), rgba(99, 102, 241, 0.35)), url('https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "48px 36px",
        borderRadius: "var(--border-radius)",
        color: "#fff",
        marginBottom: "24px",
        boxShadow: "var(--shadow-md)"
      }}>
        <span className="brand-pill" style={{ background: "rgba(255, 255, 255, 0.2)", color: "#fff", marginBottom: 12 }}>Analytics Suite</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, margin: "6px 0 10px", letterSpacing: "-0.5px" }}>Business Reports & Analytics</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", maxWidth: 500, lineHeight: 1.6 }}>
          Track profit margins, gross revenue growth, expense sheets, and product sales distributions dynamically.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          [<ReportsIcon />, "Monthly Revenue", rupee(dashboard?.month?.revenue), "blue"],
          [<PricingIcon />, "Gross Profit", rupee(dashboard?.month?.profit), "green"],
          [<ExpensesIcon />, "Total Expenses", rupee(dashboard?.month?.expenses), "yellow"],
          [<AIIcon />, "Net Profit", rupee(dashboard?.month?.netProfit), "green"],
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
        <div className="card-header">
          <span className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ProductsIcon /> Top Products by Profit
          </span>
        </div>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          {!profit?.productProfit?.length ? (
            <div className="empty-state" style={{ padding: "48px 24px" }}>
              <ProductsIcon style={{ width: 48, height: 48, strokeWidth: 1.5, marginBottom: 16, color: "var(--text-muted)" }} />
              <h3>No sales data yet</h3>
            </div>
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
