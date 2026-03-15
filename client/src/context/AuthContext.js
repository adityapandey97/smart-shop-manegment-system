// ============================================
//   Auth Context
//   Manages login state across the whole app
//   Any component can use: useAuth()
// ============================================

import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";

// Create the context
const AuthContext = createContext(null);

// Provider component wraps the whole app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Current logged in user
  const [loading, setLoading] = useState(true); // App is loading initially

  // On app start, check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("smartshop_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Set token in API headers for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${parsedUser.token}`;
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("smartshop_user", JSON.stringify(userData));
    api.defaults.headers.common["Authorization"] = `Bearer ${userData.token}`;
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("smartshop_user");
    delete api.defaults.headers.common["Authorization"];
  };

  // Check if user has a specific role
  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === "string") return user.role === roles;
    return roles.includes(user.role);
  };

  const value = { user, login, logout, loading, hasRole, isOwner: user?.role === "owner", isManager: user?.role === "manager" || user?.role === "owner" };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth in any component
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
