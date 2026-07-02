// ============================================
//   Sidebar Component
//   Navigation menu on the left side
// ============================================

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const navItems = [
  { label: "Dashboard", icon: "📊", path: "/" },
  { section: "Operations" },
  { label: "Products", icon: "📦", path: "/products" },
  { label: "Sales", icon: "🧾", path: "/sales" },
  { label: "Purchases", icon: "🛒", path: "/purchases" },
  { label: "Suppliers", icon: "🏭", path: "/suppliers" },
  { section: "Finance" },
  { label: "Customers", icon: "👥", path: "/customers" },
  { label: "Udhar", icon: "💳", path: "/udhar" },
  { label: "Expenses", icon: "💰", path: "/expenses" },
  { section: "Analytics" },
  { label: "Pricing", icon: "🏷️", path: "/pricing" },
  { label: "Reports", icon: "📈", path: "/reports" },
  { section: "Account" },
  { label: "Settings", icon: "⚙️", path: "/settings" },
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
      <div className="sidebar-logo">
        <div className="brand-pill">SmartShop</div>
        <p>Unified shop management dashboard</p>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
        <div className="user-meta">
          <span className="user-name">{user?.name}</span>
          <span className="user-role">{user?.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
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
              <span>{t(item.label.toLowerCase())}</span>
            </NavLink>
          );
        })}

        <button className="nav-item logout-button" onClick={handleLogout}>
          <span className="nav-icon">🚪</span>
          <span>{t("logout")}</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <span>SmartShop v1.0</span>
        <small>Built for smart retail teams</small>
      </div>
    </aside>
  );
};

export default Sidebar;
