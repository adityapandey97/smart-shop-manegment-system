// ============================================
//   Settings Page
// ============================================
import React, { useState } from "react";
import toast from "react-hot-toast";
import { authAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const SettingsPage = () => {
  const { user, login } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage } = useTheme();
  const [form, setForm] = useState({ name: user?.name || "", phone: user?.phone || "", password: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return toast.error("Passwords do not match");
    }
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone };
      if (form.password) payload.password = form.password;
      const res = await authAPI.updateProfile(payload);
      login(res.data.data);
      toast.success("Profile updated! ✅");
      setForm(prev => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 640 }}>
      {/* Profile Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">👤 Profile Settings</span></div>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, padding: "16px", background: "var(--bg-hover)", borderRadius: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #2563eb, #7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 22 }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>{user?.email}</div>
              <span className="badge badge-primary" style={{ marginTop: 4, textTransform: "capitalize" }}>{user?.role}</span>
            </div>
          </div>
          <form onSubmit={handleSave}>
            <div className="form-grid-2">
              <div className="form-group"><label className="form-label">Full Name</label>
                <input name="name" className="form-control" value={form.name} onChange={handleChange} />
              </div>
              <div className="form-group"><label className="form-label">Phone Number</label>
                <input name="phone" className="form-control" value={form.phone} onChange={handleChange} placeholder="+91 XXXXXXXXXX" />
              </div>
              <div className="form-group"><label className="form-label">New Password (leave blank to keep)</label>
                <input name="password" type="password" className="form-control" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" />
              </div>
              <div className="form-group"><label className="form-label">Confirm New Password</label>
                <input name="confirmPassword" type="password" className="form-control" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner" /> Saving...</> : "Save Changes"}
            </button>
          </form>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">🎨 Appearance</span></div>
        <div className="card-body">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontWeight: 600 }}>{theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Switch between dark and light themes</div>
            </div>
            <button className={`btn ${theme === "dark" ? "btn-primary" : "btn-ghost"}`} onClick={toggleTheme}>
              {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
            <div>
              <div style={{ fontWeight: 600 }}>🌐 Language</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Switch between English and Hindi</div>
            </div>
            <button className="btn btn-outline" onClick={toggleLanguage}>
              {language === "en" ? "🇮🇳 Switch to हिंदी" : "🇬🇧 Switch to English"}
            </button>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="card">
        <div className="card-header"><span className="card-title">ℹ️ App Information</span></div>
        <div className="card-body">
          {[["App Name", "SmartShop Management System"], ["Version", "v1.0.0"], ["Stack", "MERN (MongoDB, Express, React, Node.js)"], ["Payment", "Razorpay Integration"], ["Language Support", "English + हिंदी"]].map(([label, val]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
