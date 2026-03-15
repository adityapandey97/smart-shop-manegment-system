// ============================================
//   Login Page
//   Beautiful login form with light/dark mode
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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "staff" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await authAPI.register(form);
        toast.success("Account created! Welcome to SmartShop 🎉");
      } else {
        res = await authAPI.login({ email: form.email, password: form.password });
        toast.success(`Welcome back, ${res.data.data.name}! 👋`);
      }
      login(res.data.data);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: theme === "dark"
        ? "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)"
        : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #eff6ff 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      fontFamily: "Poppins, sans-serif",
    }}>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{
          position: "fixed", top: 20, right: 20,
          background: "var(--bg-card)", border: "1px solid var(--border)",
          borderRadius: "50%", width: 42, height: 42,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 20, boxShadow: "var(--shadow-sm)",
        }}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>

      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏪</div>
          <h1 style={{
            fontFamily: "Baloo 2, Poppins, sans-serif",
            fontSize: 32, fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: -1,
          }}>
            Smart<span style={{ color: "#2563eb" }}>Shop</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14, marginTop: 4 }}>
            Complete Shop Management System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "var(--bg-card)",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          padding: "32px 32px 28px",
          border: "1px solid var(--border)",
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: "var(--text-primary)" }}>
            {isRegister ? "Create Account" : "Welcome Back!"}
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 24 }}>
            {isRegister ? "Fill in details to get started" : "Sign in to manage your shop"}
          </p>

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  name="name" type="text" className="form-control"
                  placeholder="e.g. Ramesh Kumar" value={form.name}
                  onChange={handleChange} required={isRegister}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                name="email" type="email" className="form-control"
                placeholder="your@email.com" value={form.email}
                onChange={handleChange} required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                name="password" type="password" className="form-control"
                placeholder="Min. 6 characters" value={form.password}
                onChange={handleChange} required
              />
            </div>

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="owner">Owner (Full Access)</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff (Basic)</option>
                </select>
              </div>
            )}

            <button
              type="submit" className="btn btn-primary w-full btn-lg"
              disabled={loading} style={{ marginTop: 8 }}
            >
              {loading ? <><span className="spinner" /> Loading...</> : isRegister ? "Create Account 🚀" : "Sign In →"}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13 }}>
            <span style={{ color: "var(--text-secondary)" }}>
              {isRegister ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              onClick={() => setIsRegister(!isRegister)}
              style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              {isRegister ? "Sign In" : "Create one"}
            </button>
          </div>
        </div>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: 16, padding: "12px 16px",
          background: "rgba(37, 99, 235, 0.1)",
          borderRadius: 10, textAlign: "center",
          border: "1px solid rgba(37, 99, 235, 0.2)",
        }}>
          <p style={{ fontSize: 12, color: "#2563eb", margin: 0 }}>
            💡 First time? Register as <strong>Owner</strong> to get full access
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
