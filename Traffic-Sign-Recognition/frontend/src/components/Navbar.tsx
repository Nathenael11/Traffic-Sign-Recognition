import React from "react";
import { api } from "../utils/api";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentTheme: string;
  toggleTheme: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentTheme,
  toggleTheme,
  onLogout,
}) => {
  const username = api.getCurrentUsername();
  const role = api.getCurrentUserRole();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src="/mint_logo.jpg" alt="MInT Logo" className="navbar-logo" />
        <div>
          <h1 className="navbar-title">MInT Incubator</h1>
          <span style={{ fontSize: "0.7rem", color: "var(--secondary)", display: "block", marginTop: "-3px", fontWeight: 600, letterSpacing: "0.05em" }}>
            ETHIOPIA IIP
          </span>
        </div>
      </div>

      <div className="navbar-links">
        <span
          className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </span>
        <span
          className={`nav-link ${activeTab === "ideas" ? "active" : ""}`}
          onClick={() => setActiveTab("ideas")}
        >
          Idea Hub
        </span>
        <span
          className={`nav-link ${activeTab === "mentors" ? "active" : ""}`}
          onClick={() => setActiveTab("mentors")}
        >
          Mentors
        </span>
        <span
          className={`nav-link ${activeTab === "sandbox" ? "active" : ""}`}
          onClick={() => setActiveTab("sandbox")}
        >
          Sandbox
        </span>
        <span
          className={`nav-link ${activeTab === "grants" ? "active" : ""}`}
          onClick={() => setActiveTab("grants")}
        >
          Grants
        </span>
      </div>

      <div className="navbar-actions">
        <button className="theme-btn" onClick={toggleTheme} title="Toggle theme">
          {currentTheme === "dark" ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderLeft: "1px solid rgba(255,255,255,0.15)", paddingLeft: "0.75rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{username}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--secondary)", textTransform: "capitalize" }}>{role}</div>
          </div>
          <button
            className="btn btn-outline"
            onClick={onLogout}
            style={{
              padding: "0.35rem 0.65rem",
              fontSize: "0.75rem",
              borderColor: "rgba(255,255,255,0.2)",
              color: "#ffffff"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};
