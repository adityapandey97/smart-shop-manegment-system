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

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Role</label>
                <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                  <option value="owner">Owner (Full Access)</option>
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            )}

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
