// ============================================
//   Header Component
//   Top bar with title, dark mode, language toggle
// ============================================

import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

const Header = ({ title, onMenuClick }) => {
  const { theme, toggleTheme, language, toggleLanguage } = useTheme();
  const { user } = useAuth();

  return (
    <header className="header">
      {/* Left: Hamburger + Page Title */}
      <div className="header-left">
        {/* Mobile menu toggle */}
        <button className="icon-btn" onClick={onMenuClick} title="Menu" style={{ display: "none" }}>
          ☰
        </button>
        <h2 className="page-title">{title}</h2>
      </div>

      {/* Right: Controls */}
      <div className="header-right">
        {/* Language Toggle: English / Hindi */}
        <button
          className="btn btn-ghost btn-sm"
          onClick={toggleLanguage}
          title="Switch Language"
          style={{ fontWeight: 700, minWidth: 56 }}
        >
          {language === "en" ? "🇮🇳 हिंदी" : "🇬🇧 English"}
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          className="icon-btn"
          onClick={toggleTheme}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{ fontSize: 20 }}
        >
          {theme === "dark" ? "☀️" : "🌙"}
        </button>

        {/* Notification Bell (placeholder) */}
        <button className="icon-btn" title="Notifications" style={{ position: "relative" }}>
          🔔
          <span
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: "#dc2626",
              borderRadius: "50%",
              border: "2px solid var(--bg-header)",
            }}
          />
        </button>

        {/* User Avatar */}
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
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
          }}
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
