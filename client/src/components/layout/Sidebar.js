// ============================================
//   Sidebar Component
//   Navigation menu on the left side
// ============================================

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

// All navigation items
const navItems = [
  { label: "dashboard", icon: "📊", path: "/" },
  { section: "Shop Management" },
  { label: "products", icon: "📦", path: "/products" },
  { label: "sales", icon: "🧾", path: "/sales" },
  { label: "purchases", icon: "🛒", path: "/purchases" },
  { label: "suppliers", icon: "🏭", path: "/suppliers" },
  { section: "Finance" },
  { label: "customers", icon: "👥", path: "/customers" },
  { label: "udhar", icon: "💳", path: "/udhar" },
  { label: "expenses", icon: "💰", path: "/expenses" },
  { section: "Insights" },
  { label: "pricing", icon: "🏷️", path: "/pricing" },
  { label: "reports", icon: "📈", path: "/reports" },
  { section: "Account" },
  { label: "settings", icon: "⚙️", path: "/settings" },
];

const Sidebar = ({ isOpen }) => {
  const { user, logout } = useAuth();
  const { t } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <h1>🏪 Smart<span>Shop</span></h1>
        <p>Shop Management System</p>
      </div>

      {/* User info */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 15,
              flexShrink: 0,
            }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>{user?.name}</div>
            <div style={{ color: "#94a3b8", fontSize: 11, textTransform: "capitalize" }}>
              {user?.role} 👑
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          // Render section headers
          if (item.section) {
            return (
              <div key={idx} className="nav-section-label">
                {item.section}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              end={item.path === "/"}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{t(item.label)}</span>
            </NavLink>
          );
        })}

        {/* Logout button */}
        <button className="nav-item" onClick={handleLogout} style={{ marginTop: 8 }}>
          <span className="nav-icon">🚪</span>
          <span>{t("logout")}</span>
        </button>
      </nav>

      {/* Version tag */}
      <div style={{ padding: "12px 16px", color: "#475569", fontSize: 11 }}>
        SmartShop v1.0.0 · Made with ❤️
      </div>
    </aside>
  );
};

export default Sidebar;
