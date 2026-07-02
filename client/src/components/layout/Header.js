// ============================================
//   Header Component
//   Top bar with title, search, and quick actions
// ============================================

import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Header = ({ title, onMenuClick }) => {
  const { theme, toggleTheme, language, toggleLanguage } = useTheme();
  const { user } = useAuth();

  return (
    <header className="header">
      <div className="header-left">
        <button className="icon-btn menu-toggle" onClick={onMenuClick} title="Toggle menu">
          ☰
        </button>
        <div>
          <p className="page-label">Dashboard</p>
          <h2 className="page-title">{title}</h2>
        </div>
      </div>

      <div className="header-center">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input className="search-input" placeholder="Search orders, products, customers..." />
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-ghost btn-sm" onClick={toggleLanguage} title="Switch language">
          {language === "en" ? "हिंदी" : "English"}
        </button>

        <button className="icon-btn" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        <button className="icon-btn notification-btn" title="Notifications">
          🔔
          <span className="notification-dot" />
        </button>

        <div className="user-avatar" title={user?.name}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
