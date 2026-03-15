// ============================================
//   Theme Context
//   Manages dark/light mode + language
// ============================================

import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  // Load saved theme or default to light
  const [theme, setTheme] = useState(() => localStorage.getItem("smartshop_theme") || "light");

  // Load saved language (en = English, hi = Hindi)
  const [language, setLanguage] = useState(() => localStorage.getItem("smartshop_lang") || "en");

  // Apply theme to the whole document whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("smartshop_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("smartshop_lang", language);
  }, [language]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const toggleLanguage = () => setLanguage((prev) => (prev === "en" ? "hi" : "en"));

  // Translation strings - English and Hindi
  const translations = {
    en: {
      dashboard: "Dashboard", products: "Products", sales: "Sales", customers: "Customers",
      suppliers: "Suppliers", purchases: "Purchases", expenses: "Expenses", reports: "Reports",
      udhar: "Udhar Ledger", pricing: "Pricing", settings: "Settings", logout: "Logout",
      addProduct: "Add Product", addSale: "New Sale", addCustomer: "Add Customer",
      totalRevenue: "Total Revenue", totalProfit: "Total Profit", netProfit: "Net Profit",
      pendingUdhar: "Pending Udhar", lowStock: "Low Stock", deadStock: "Dead Stock",
      todaySales: "Today's Sales", save: "Save", cancel: "Cancel", delete: "Delete",
      edit: "Edit", search: "Search...", loading: "Loading...", noData: "No data found",
    },
    hi: {
      dashboard: "डैशबोर्ड", products: "उत्पाद", sales: "बिक्री", customers: "ग्राहक",
      suppliers: "सप्लायर", purchases: "खरीद", expenses: "खर्च", reports: "रिपोर्ट",
      udhar: "उधार बही", pricing: "मूल्य निर्धारण", settings: "सेटिंग्स", logout: "लॉग आउट",
      addProduct: "उत्पाद जोड़ें", addSale: "नई बिक्री", addCustomer: "ग्राहक जोड़ें",
      totalRevenue: "कुल आय", totalProfit: "कुल लाभ", netProfit: "शुद्ध लाभ",
      pendingUdhar: "बकाया उधार", lowStock: "कम स्टॉक", deadStock: "डेड स्टॉक",
      todaySales: "आज की बिक्री", save: "सहेजें", cancel: "रद्द करें", delete: "हटाएं",
      edit: "संपादित करें", search: "खोजें...", loading: "लोड हो रहा है...", noData: "कोई डेटा नहीं",
    },
  };

  // Helper to get translated text
  const t = (key) => translations[language][key] || key;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, language, toggleLanguage, t, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
};
