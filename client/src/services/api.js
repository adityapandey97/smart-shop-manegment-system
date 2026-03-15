// ============================================
//   API Service (Axios)
//   All backend API calls go through this file
//   Base URL is auto-set from package.json proxy
// ============================================

import axios from "axios";

// Create a customized axios instance
// Auto-detects environment:
// - localhost       → uses /api proxy (local dev)
// - Vercel (live)   → uses Render backend URL directly
const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

// Your Render backend URL — hardcoded as safety fallback
const RENDER_URL = "https://smart-shop-manegment-system.onrender.com";

const API_BASE = isLocalhost
  ? "/api"
  : `${process.env.REACT_APP_API_URL || RENDER_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request Interceptor ----
// Runs before every request - attaches the token
api.interceptors.request.use(
  (config) => {
    // Get stored user data from localStorage
    const user = JSON.parse(localStorage.getItem("smartshop_user") || "null");
    if (user?.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor ----
// Runs after every response - handles errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid, log the user out
    if (error.response?.status === 401) {
      localStorage.removeItem("smartshop_user");
      window.location.href = "/login"; // Redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;

// ---- Pre-built API functions for each module ----

// Auth
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (data) => api.put("/auth/profile", data),
  getAllUsers: () => api.get("/auth/users"),
};

// Products
export const productAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post("/products", data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get("/products/low-stock"),
  getDeadStock: () => api.get("/products/dead-stock"),
};

// Suppliers
export const supplierAPI = {
  getAll: () => api.get("/suppliers"),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  compare: (productId) => api.get("/suppliers/compare", { params: { productId } }),
};

// Purchases
export const purchaseAPI = {
  getAll: () => api.get("/purchases"),
  create: (data) => api.post("/purchases", data),
};

// Sales
export const salesAPI = {
  getAll: (params) => api.get("/sales", { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post("/sales", data),
};

// Customers
export const customerAPI = {
  getAll: (params) => api.get("/customers", { params }),
  create: (data) => api.post("/customers", data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  getLedger: (id) => api.get(`/customers/${id}/ledger`),
};

// Udhar
export const udharAPI = {
  recordPayment: (data) => api.post("/udhar/pay", data),
  getHistory: (customerId) => api.get(`/udhar/history/${customerId}`),
  getPending: () => api.get("/udhar/pending"),
};

// Expenses
export const expenseAPI = {
  getAll: (params) => api.get("/expenses", { params }),
  create: (data) => api.post("/expenses", data),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Reports
export const reportAPI = {
  getDashboard: () => api.get("/reports/dashboard"),
  getProfit: (params) => api.get("/reports/profit", { params }),
};

// Pricing
export const pricingAPI = {
  getHistory: (productId) => api.get(`/pricing/history/${productId}`),
  getSuggestion: (data) => api.post("/pricing/suggest", data),
  applyPrice: (productId, data) => api.put(`/pricing/apply/${productId}`, data),
  getAlerts: () => api.get("/pricing/alerts"),
};

// Payments (Razorpay)
export const paymentAPI = {
  createOrder: (data) => api.post("/payment/create-order", data),
  verify: (data) => api.post("/payment/verify", data),
};