// ============================================
//   Login Page
//   Modern authentication experience
// ============================================

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { authAPI } from "../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff", phone: "", storeName: "", storeId: "" });
  const [storeQuery, setStoreQuery] = useState("");
  const [storeResults, setStoreResults] = useState([]);
  const [searchingStore, setSearchingStore] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleStoreSearch = async (val) => {
    setStoreQuery(val);
    if (val.trim().length >= 2) {
      setSearchingStore(true);
      try {
        const res = await authAPI.searchStore(val);
        setStoreResults(res.data.data);
      } catch (err) {
        console.error("Store search failed", err);
      } finally {
        setSearchingStore(false);
      }
    } else {
      setStoreResults([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await authAPI.register(form);
        if (form.role === "owner") {
          toast.success(res.data.message || "Account created! Welcome to SmartShop 🎉");
          login(res.data.data);
          navigate("/");
        } else {
          toast.success(res.data.message || "Registration request sent! Please wait for approval. 📋");
          setIsRegister(false); // Switch to login screen
        }
      } else {
        res = await authAPI.login({ email: form.email, password: form.password });
        toast.success(`Welcome back, ${res.data.data.name}! 👋`);
        login(res.data.data);
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div className="auth-card">
        <div className="auth-hero">
          <div>
            <span className="brand-pill">SmartShop</span>
            <h1 className="auth-hero-title">Power your store with a professional dashboard</h1>
            <p className="auth-hero-text">
              Track inventory, sales, customers and pricing from a clean, modern workspace built for retailers.
            </p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">Manage products and stock in one place</div>
            <div className="auth-feature">Review reports and sales insights quickly</div>
            <div className="auth-feature">Keep expenses, purchases, and vendors organized</div>
          </div>
        </div>

        <div className="auth-panel">
          <div className="auth-form-header">
            <h2>{isRegister ? "Create your account" : "Welcome back"}</h2>
            <p>{isRegister ? "Sign up and start managing your shop today." : "Log in to continue to your dashboard."}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full name</label>
                  <input
                    name="name"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Priya Sharma"
                    value={form.name}
                    onChange={handleChange}
                    required={isRegister}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone number</label>
                  <input
                    name="phone"
                    type="tel"
                    className="form-control"
                    placeholder="e.g. +91 9876543210"
                    value={form.phone}
                    onChange={handleChange}
                    required={isRegister}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="owner">Owner (Full Access)</option>
                  </select>
                </div>

                {form.role === "owner" ? (
                  <div className="form-group">
                    <label className="form-label">Store Name *</label>
                    <input
                      name="storeName"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Priya Grocery Store"
                      value={form.storeName}
                      onChange={handleChange}
                      required={form.role === "owner"}
                    />
                  </div>
                ) : (
                  <>
                    <div className="form-group" style={{ position: "relative" }}>
                      <label className="form-label">Search Store Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Type store name to search..."
                        value={storeQuery}
                        onChange={(e) => handleStoreSearch(e.target.value)}
                        required={form.role !== "owner"}
                      />
                      {searchingStore && <small style={{ color: "var(--text-muted)", marginTop: 4, display: "block" }}>Searching stores...</small>}
                      {storeResults.length > 0 && (
                        <div style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          boxShadow: "var(--shadow-lg)",
                          zIndex: 100,
                          maxHeight: 180,
                          overflowY: "auto"
                        }}>
                          {storeResults.map((s) => (
                            <div
                              key={s.storeId}
                              onClick={() => {
                                setStoreQuery(s.storeName);
                                setForm({ ...form, storeId: s.storeId });
                                setStoreResults([]);
                              }}
                              style={{
                                padding: "10px 12px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border)",
                                fontSize: "13px",
                                color: "var(--text-primary)"
                              }}
                              onMouseEnter={(e) => e.target.style.background = "var(--bg-hover)"}
                              onMouseLeave={(e) => e.target.style.background = "transparent"}
                            >
                              <strong>{s.storeName}</strong> <span style={{ fontSize: 11, color: "var(--text-muted)" }}>({s.storeId})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="form-group">
                      <label className="form-label">Store ID (5-digit code) *</label>
                      <input
                        name="storeId"
                        type="text"
                        className="form-control"
                        placeholder="Auto-filled from search or type 5-digit code"
                        value={form.storeId}
                        onChange={handleChange}
                        required={form.role !== "owner"}
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                name="email"
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
              {loading ? <><span className="spinner" /> Processing...</> : isRegister ? "Create account" : "Sign in"}
            </button>
          </form>

          <div className="auth-switch">
            <span>{isRegister ? "Already have an account?" : "New to SmartShop?"}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setIsRegister(!isRegister)}>
              {isRegister ? "Sign in" : "Create account"}
            </button>
          </div>

          <div className="auth-note">
            Tip: Register as an owner for full admin access when setting up your system.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
