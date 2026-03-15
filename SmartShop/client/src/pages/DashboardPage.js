// ============================================
//   Dashboard Page
//   Main overview: sales, stock, udhar, profit
// ============================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { reportAPI } from "../services/api";
import { useTheme } from "../context/ThemeContext";

// Format currency
const rupee = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

// Stat Card component
const StatCard = ({ icon, label, value, sub, color = "blue", onClick }) => (
  <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  </div>
);

const DashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t, isDark } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await reportAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-primary" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const chartColor = isDark ? "#60a5fa" : "#2563eb";
  const chartColor2 = isDark ? "#34d399" : "#16a34a";
  const gridColor = isDark ? "#334155" : "#e2e8f0";

  return (
    <div>
      {/* Alerts Section */}
      {data?.stock?.lowStockProducts > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 20 }}>
          ⚠️ <strong>{data.stock.lowStockProducts} products</strong> are running low on stock.{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => navigate("/products?filter=lowStock")}
          >
            View now →
          </span>
        </div>
      )}
      {data?.udhar?.highRiskCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 20 }}>
          🚨 <strong>{data.udhar.highRiskCount} high-risk customers</strong> have large pending udhars.{" "}
          <span
            style={{ textDecoration: "underline", cursor: "pointer" }}
            onClick={() => navigate("/udhar")}
          >
            Review →
          </span>
        </div>
      )}

      {/* Today's Stats */}
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        Today's Overview
      </h3>
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <StatCard icon="💵" label="Today's Revenue" value={rupee(data?.today?.revenue)} sub={`${data?.today?.salesCount} sales`} color="blue" />
        <StatCard icon="📈" label="Today's Profit" value={rupee(data?.today?.profit)} color="green" />
        <StatCard icon="💳" label="Pending Udhar" value={rupee(data?.udhar?.totalPending)} sub={`${data?.udhar?.customerCount} customers`} color="yellow" onClick={() => navigate("/udhar")} />
        <StatCard icon="📦" label="Low Stock Items" value={data?.stock?.lowStockProducts} sub="Need restock" color="red" onClick={() => navigate("/products")} />
      </div>

      {/* Monthly Stats */}
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
        This Month
      </h3>
      <div className="stats-grid">
        <StatCard icon="🏷️" label="Monthly Revenue" value={rupee(data?.month?.revenue)} sub={`${data?.month?.salesCount} sales`} color="blue" />
        <StatCard icon="💰" label="Gross Profit" value={rupee(data?.month?.profit)} color="green" />
        <StatCard icon="🧾" label="Total Expenses" value={rupee(data?.month?.expenses)} color="yellow" />
        <StatCard icon="✅" label="Net Profit" value={rupee(data?.month?.netProfit)} sub="After expenses" color={data?.month?.netProfit >= 0 ? "green" : "red"} />
        <StatCard icon="📊" label="Stock Value" value={rupee(data?.stock?.totalStockValue)} color="cyan" />
        <StatCard icon="🪦" label="Dead Stock" value={data?.stock?.deadStockCount} sub="Not sold 45+ days" color="red" onClick={() => navigate("/products")} />
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 24 }}>
        {/* Last 7 Days Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Last 7 Days Sales</span>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.last7Days || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(val) => rupee(val)}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill={chartColor} radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill={chartColor2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔥 Top Selling Products</span>
          </div>
          <div className="card-body" style={{ padding: "12px 20px" }}>
            {data?.topProducts?.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <p>No sales data yet</p>
              </div>
            )}
            {data?.topProducts?.map((p, i) => (
              <div key={p._id} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 0", borderBottom: i < data.topProducts.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: i === 0 ? "#fbbf24" : i === 1 ? "#94a3b8" : i === 2 ? "#f97316" : "var(--bg-hover)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 800, fontSize: 12, color: i < 3 ? "#fff" : "var(--text-muted)", flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.productName}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{p.totalQty} units sold</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--success)" }}>{rupee(p.totalProfit)}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>profit</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
