import React, { useState, useEffect } from "react";
import { api } from "../utils/api";

interface AuthPageProps {
  onLoginSuccess: () => void;
  initialIsLogin?: boolean;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess, initialIsLogin = true }) => {
  const [isLogin, setIsLogin] = useState(initialIsLogin);

  useEffect(() => {
    setIsLogin(initialIsLogin);
  }, [initialIsLogin]);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("innovator");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      if (isLogin) {
        await api.login(username || email, password);
        onLoginSuccess();
      } else {
        await api.register(username, email, role, password);
        setSuccessMsg("Registration successful! You can now log in.");
        setIsLogin(true);
        setPassword("");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ background: "var(--bg-card)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-md)", padding: "2.5rem" }}>
        
        {/* Logo and Header info */}
        <div className="auth-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <img 
            src="/mint_logo.jpg" 
            alt="MInT Logo" 
            className="auth-header-logo" 
            style={{ height: "60px", width: "60px", borderRadius: "50%", border: "2px solid var(--secondary)", marginBottom: "0.75rem", objectFit: "cover" }} 
          />
          <h2 style={{ fontSize: "1.75rem", color: "var(--primary)", fontWeight: 700 }}>MInT Portal</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: "0.25rem" }}>
            Federal Startup Incubation Ecosystem
          </p>
        </div>

        {/* Top Tab Bar Switcher (highly applicable UX component) */}
        <div style={{ display: "flex", borderBottom: "2px solid var(--border-card)", marginBottom: "1.5rem" }}>
          <button
            type="button"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              borderBottom: isLogin ? "3px solid var(--primary)" : "3px solid transparent",
              padding: "0.75rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: isLogin ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
            onClick={() => { setIsLogin(true); setError(""); }}
          >
            Sign In
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              borderBottom: !isLogin ? "3px solid var(--primary)" : "3px solid transparent",
              padding: "0.75rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              color: !isLogin ? "var(--primary)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "var(--transition-smooth)"
            }}
            onClick={() => { setIsLogin(false); setError(""); }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            background: "rgba(229, 62, 62, 0.08)",
            color: "var(--error)",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            border: "1px solid rgba(229, 62, 62, 0.15)"
          }}>
            {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: "rgba(56, 161, 105, 0.08)",
            color: "var(--success)",
            padding: "0.75rem",
            borderRadius: "var(--radius-sm)",
            marginBottom: "1rem",
            fontSize: "0.85rem",
            fontWeight: 500,
            border: "1px solid rgba(56, 161, 105, 0.15)"
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: "1rem" }}>
              <label htmlFor="email" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>Email Address</label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label htmlFor="username" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>{isLogin ? "Username or Email" : "Username"}</label>
            <input
              id="username"
              type="text"
              className="form-control"
              placeholder={isLogin ? "enter username or email" : "choose username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: "1.25rem" }}>
            <label htmlFor="password" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>Password</label>
            <input
              id="password"
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ marginBottom: "1.25rem" }}>
              <label htmlFor="role" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, marginBottom: "0.4rem", color: "var(--text-muted)" }}>I am registering as an</label>
              <select
                id="role"
                className="form-control"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ background: "#FFFFFF", color: "var(--text-main)" }}
              >
                <option value="innovator">Innovator (Startups / Ideas)</option>
                <option value="mentor">Mentor (Reviewer / Advisor)</option>
                <option value="investor">Investor (Venture Capital)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-accent"
            style={{ width: "100%", marginTop: "0.5rem", color: "var(--primary)", fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? "Processing..." : isLogin ? "Sign In" : "Register"}
          </button>
        </form>

        {/* Demo Account Quick-Fills */}
        {isLogin && (
          <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.5rem", textTransform: "uppercase", letterSpacing: "0.03em" }}>
              Demo Accounts:
            </span>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", minHeight: "30px", background: "#FFFFFF", color: "var(--text-main)" }}
                onClick={() => {
                  setUsername("abdi_m");
                  setPassword("innovator123");
                }}
              >
                Abdi (Innovator)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", minHeight: "30px", background: "#FFFFFF", color: "var(--text-main)" }}
                onClick={() => {
                  setUsername("helen_t");
                  setPassword("mentor123");
                }}
              >
                Helen (Mentor)
              </button>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: "0.25rem 0.5rem", fontSize: "0.72rem", minHeight: "30px", background: "#FFFFFF", color: "var(--text-main)" }}
                onClick={() => {
                  setUsername("admin");
                  setPassword("admin123");
                }}
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
