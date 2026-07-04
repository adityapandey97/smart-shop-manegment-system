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
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <div>
          <p className="page-label">SmartShop Platform</p>
          <h2 className="page-title">{title}</h2>
        </div>
      </div>

      <div className="header-center">
        <div className="search-box">
          <span className="search-icon">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </span>
          <input className="search-input" placeholder="Search invoices, stock, suppliers..." />
        </div>
      </div>

      <div className="header-right">
        <button className="btn btn-ghost btn-sm" onClick={toggleLanguage} title="Switch language" style={{ letterSpacing: 0.5 }}>
          {language === "en" ? "हिंदी" : "English"}
        </button>

        <button className="icon-btn" onClick={toggleTheme} title={theme === "dark" ? "Light mode" : "Dark mode"}>
          {theme === "dark" ? (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
          ) : (
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>

        <button className="icon-btn notification-btn" title="Notifications">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
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
