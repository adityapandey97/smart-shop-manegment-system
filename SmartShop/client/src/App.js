// ============================================
//   App.js - Main Router
//   Defines all pages and their URL paths
// ============================================

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Layout
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// Pages
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ProductsPage from "./pages/ProductsPage";
import SalesPage from "./pages/SalesPage";
import PurchasesPage from "./pages/PurchasesPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import UdharPage from "./pages/UdharPage";
import ExpensesPage from "./pages/ExpensesPage";
import ReportsPage from "./pages/ReportsPage";
import PricingPage from "./pages/PricingPage";
import SettingsPage from "./pages/SettingsPage";

// Page title mapping
const pageTitles = {
  "/": "📊 Dashboard",
  "/products": "📦 Products",
  "/sales": "🧾 Sales",
  "/purchases": "🛒 Purchases",
  "/customers": "👥 Customers",
  "/suppliers": "🏭 Suppliers",
  "/udhar": "💳 Udhar Ledger",
  "/expenses": "💰 Expenses",
  "/reports": "📈 Reports",
  "/pricing": "🏷️ Dynamic Pricing",
  "/settings": "⚙️ Settings",
};

// Protected route - redirects to login if not logged in
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner spinner-primary" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// App shell with sidebar + header
const AppShell = ({ children, path }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const title = pageTitles[path] || "SmartShop";

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Header title={title} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
};

// Inner app with routes (needs auth context)
const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />

      {/* Protected routes */}
      {[
        { path: "/", element: <DashboardPage /> },
        { path: "/products", element: <ProductsPage /> },
        { path: "/sales", element: <SalesPage /> },
        { path: "/purchases", element: <PurchasesPage /> },
        { path: "/customers", element: <CustomersPage /> },
        { path: "/suppliers", element: <SuppliersPage /> },
        { path: "/udhar", element: <UdharPage /> },
        { path: "/expenses", element: <ExpensesPage /> },
        { path: "/reports", element: <ReportsPage /> },
        { path: "/pricing", element: <PricingPage /> },
        { path: "/settings", element: <SettingsPage /> },
      ].map(({ path, element }) => (
        <Route
          key={path}
          path={path}
          element={
            <ProtectedRoute>
              <AppShell path={path}>{element}</AppShell>
            </ProtectedRoute>
          }
        />
      ))}

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Root app
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                fontSize: "13.5px",
                fontFamily: "Poppins, sans-serif",
              },
            }}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
