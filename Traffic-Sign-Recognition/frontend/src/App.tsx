import { useState, useEffect } from "react";
import { api } from "./utils/api";
import { AuthPage } from "./components/AuthPage";
import { Navbar } from "./components/Navbar";
import { Dashboard } from "./components/Dashboard";
import { IdeaPortal } from "./components/IdeaPortal";
import { MentorsHub } from "./components/MentorsHub";
import { TechSandbox } from "./components/TechSandbox";
import { GrantsHub } from "./components/GrantsHub";
import { EthioAIAssistant } from "./components/EthioAIAssistant";

// Clean illustrated SVG avatars representing Ethiopian users with diverse skin tones
const UserAvatar: React.FC<{ skinColor: string; gender: "male" | "female" }> = ({ skinColor, gender }) => {
  return (
    <svg 
      width="64" 
      height="64" 
      viewBox="0 0 100 100" 
      style={{ borderRadius: "50%", background: "#F7FAFC", border: "2.5px solid var(--secondary)", display: "block" }}
      aria-hidden="true"
    >
      {/* Background shirt */}
      <path d="M 10 95 Q 50 60 90 95 Z" fill="var(--primary)" />
      {/* Neck */}
      <rect x="44" y="55" width="12" height="15" fill={skinColor} />
      {/* Head */}
      <circle cx="50" cy="38" r="20" fill={skinColor} />
      {/* Hair & Features */}
      {gender === "female" ? (
        <>
          {/* Black braids/curly hair profile */}
          <path d="M 28 36 Q 50 8 72 36 Z" fill="#1A202C" />
          <circle cx="28" cy="38" r="9" fill="#1A202C" />
          <circle cx="72" cy="38" r="9" fill="#1A202C" />
          <circle cx="50" cy="18" r="11" fill="#1A202C" />
        </>
      ) : (
        <>
          {/* Short clean afro cut */}
          <path d="M 26 28 Q 50 14 74 28 Z" fill="#1A202C" />
          <path d="M 26 28 Q 30 18 42 20 Q 50 18 58 20 Q 70 18 74 28 Z" fill="#1A202C" />
        </>
      )}
      {/* Eyes */}
      <circle cx="43" cy="36" r="2.5" fill="#FFFFFF" />
      <circle cx="57" cy="36" r="2.5" fill="#FFFFFF" />
      <circle cx="43" cy="36" r="1.2" fill="#1A202C" />
      <circle cx="57" cy="36" r="1.2" fill="#1A202C" />
      {/* Smile */}
      <path d="M 43 47 Q 50 52 57 47" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
};

// Partner Logo Component
const PartnerLogoCard: React.FC<{ name: string; subtitle: string; logoTxt: string; hoverColor: string }> = ({
  name,
  subtitle,
  logoTxt,
  hoverColor,
}) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <div
      className="partner-logo-card"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      style={isHover ? { borderColor: hoverColor, transform: "translateY(-4px)" } : {}}
      role="listitem"
      aria-label={`${name}, ${subtitle}`}
    >
      <div
        className="partner-logo-img-placeholder"
        style={{ color: isHover ? hoverColor : "var(--text-muted)", transition: "var(--transition-smooth)" }}
      >
        {logoTxt}
      </div>
      <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", textAlign: "center" }}>{name}</div>
      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textAlign: "center" }}>{subtitle}</div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [liveUsersCount, setLiveUsersCount] = useState(1482);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [authModeIsLogin, setAuthModeIsLogin] = useState(true);

  useEffect(() => {
    // Light theme default as requested: "Background: #F7FAFC (Light Gray)"
    const savedTheme = localStorage.getItem("mint_theme") || "light";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const interval = setInterval(() => {
      setLiveUsersCount((prev) => prev + (Math.random() > 0.5 ? 1 : -1));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("mint_theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setIsAuthModalOpen(false);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
  };

  const handleOpenAuth = (modeIsLogin: boolean = true) => {
    setAuthModeIsLogin(modeIsLogin);
    setIsAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSuccess(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSuccess(false), 3000);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "ideas":
        return <IdeaPortal />;
      case "mentors":
        return <MentorsHub />;
      case "sandbox":
        return <TechSandbox />;
      case "grants":
        return <GrantsHub />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      {/* Ask Beta Floating AI chatbot - visible on all pages */}
      <EthioAIAssistant />

      {!isAuthenticated ? (
        /* --- 1. Pre-Signup Homepage (Public View) --- */
        <div style={{ background: "var(--bg-app)" }} role="region" aria-label="MInT Portal Landing Page">
          
          {/* Sticky Header Nav */}
          <header className="navbar" role="banner">
            <div className="navbar-brand">
              <img src="/mint_logo.jpg" alt="MInT Official Logo" className="navbar-logo" />
              <div>
                <h1 className="navbar-title" style={{ fontSize: "1.25rem" }}>MInT Incubator</h1>
                <span style={{ fontSize: "0.7rem", color: "var(--secondary)", display: "block", marginTop: "-3px", fontWeight: 700, letterSpacing: "0.05em" }}>
                  FEDERAL ETHIOPIA IIP
                </span>
              </div>
            </div>

            {/* Live pulsing Counter */}
            <div 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.08)", padding: "0.4rem 0.8rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)" }}
              aria-label="Pulsing Counter showing active users"
            >
              <span style={{
                height: "8px", width: "8px", borderRadius: "50%", background: "#38A169", display: "inline-block",
                boxShadow: "0 0 8px #38A169", animation: "pulse 2s infinite"
              }}></span>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#FFFFFF" }}>
                {liveUsersCount.toLocaleString()} online now
              </span>
            </div>

            {/* Navigation links & Hamburger */}
            <nav className={`navbar-links ${mobileMenuOpen ? "open" : ""}`} role="navigation" aria-label="Main Navigation">
              <a href="#about-section" className="nav-link" onClick={() => setMobileMenuOpen(false)}>About</a>
              <a href="#testimonials-section" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Stories</a>
              <a href="#partners-section" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Collaborators</a>
              <button 
                className="btn btn-outline" 
                style={{ padding: "0.45rem 1rem", fontSize: "0.85rem", color: "#FFFFFF", borderColor: "rgba(255,255,255,0.2)", minHeight: "36px" }} 
                onClick={() => handleOpenAuth(true)}
              >
                Sign In
              </button>
              <button 
                className="btn btn-accent" 
                style={{ padding: "0.45rem 1.1rem", fontSize: "0.85rem", color: "var(--primary)", minHeight: "36px" }} 
                onClick={() => handleOpenAuth(false)}
              >
                Join Now
              </button>
            </nav>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle visual theme">
                {theme === "light" ? "🌙" : "☀️"}
              </button>
              <button 
                className="mobile-nav-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle navigation menu"
              >
                ☰
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <section className="section-padding fade-in-up" style={{ background: "linear-gradient(180deg, rgba(26,54,93,0.06) 0%, transparent 100%)" }}>
            <div className="container-centered" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3rem" }}>
              <div style={{ flex: "1.2", minWidth: "300px" }}>
                {/* Trust indicator */}
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "#FFFFFF", padding: "0.4rem 0.8rem", borderRadius: "20px", border: "1px solid var(--border-card)", boxShadow: "var(--shadow-sm)", marginBottom: "1.5rem" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>✓ Trusted by 500+ Tech Innovators</span>
                </div>
                
                <h2 style={{ fontSize: "3.5rem", fontWeight: 700, color: "var(--primary)", lineHeight: "1.15", marginBottom: "1.5rem", letterSpacing: "-0.02em" }}>
                  Empowering <span style={{ color: "var(--secondary-dark)" }}>Ethiopian</span> Innovators, Building Tomorrow's Leaders
                </h2>
                
                <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: "2rem", lineHeight: "1.6" }}>
                  The premier digital incubator ecosystem managed by the Ministry of Innovation and Technology (MInT), Ethiopia. 
                  Access seed capital, build interactive app databases, optimize layouts with AI diagnostics, and schedule certified mentor reviews.
                </p>
                
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <button className="btn btn-accent" style={{ padding: "0.8rem 2rem", fontSize: "1rem" }} onClick={() => handleOpenAuth(false)}>
                    Get Started
                  </button>
                  <a href="#about-section" className="btn btn-outline" style={{ padding: "0.8rem 2rem", fontSize: "1rem" }}>
                    Explore Platform
                  </a>
                </div>
              </div>

              {/* Realistic Mockup representation (Dashboard View instead of generic stock) */}
              <div style={{ flex: "1", minWidth: "300px" }} aria-hidden="true">
                <div className="card" style={{ padding: "1.5rem", border: "1px solid var(--border-card)", background: "#FFFFFF", boxShadow: "var(--shadow-lg)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <span style={{ height: "10px", width: "10px", borderRadius: "50%", background: "#E53E3E", display: "block" }}></span>
                      <span style={{ height: "10px", width: "10px", borderRadius: "50%", background: "#ECC94B", display: "block" }}></span>
                      <span style={{ height: "10px", width: "10px", borderRadius: "50%", background: "#38A169", display: "block" }}></span>
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>MInT IIP Core Dashboard (Preview)</span>
                  </div>
                  
                  {/* Mock metrics row */}
                  <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                    <div style={{ flex: 1, background: "var(--bg-app)", padding: "0.6rem", borderRadius: "6px", textAlign: "center" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Active Ideas</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>342</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--bg-app)", padding: "0.6rem", borderRadius: "6px", textAlign: "center" }}>
                      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>Grants Disbursed</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>1.2M ETB</div>
                    </div>
                  </div>

                  {/* Mock chart */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ height: "12px", background: "linear-gradient(90deg, var(--primary) 70%, #EDF2F7 0%)", borderRadius: "4px" }}></div>
                    <div style={{ height: "12px", background: "linear-gradient(90deg, var(--secondary) 45%, #EDF2F7 0%)", borderRadius: "4px" }}></div>
                    <div style={{ height: "12px", background: "linear-gradient(90deg, var(--success) 80%, #EDF2F7 0%)", borderRadius: "4px" }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About/Features Section */}
          <section id="about-section" className="section-padding" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-card)", borderBottom: "1px solid var(--border-card)" }}>
            <div className="container-centered">
              <h3 style={{ textAlign: "center", fontSize: "2.5rem", color: "var(--primary)", marginBottom: "1rem" }}>How MInT Incubator Works</h3>
              <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 4rem auto" }}>
                Bridging the gap between raw research and commercial product releases through structured digital modules.
              </p>

              <div className="grid-3">
                <div className="card" style={{ padding: "2.5rem 1.75rem", textAlign: "center" }}>
                  <div style={{ height: "60px", width: "60px", borderRadius: "50%", background: "rgba(26,54,93,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", fontSize: "1.75rem", color: "var(--primary)" }}>🤝</div>
                  <h4 style={{ fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.75rem" }}>Connect</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    Build professional relationships with strategy mentors, legal advisors, and industry partners in Ethiopia to validate market assumptions.
                  </p>
                </div>

                <div className="card" style={{ padding: "2.5rem 1.75rem", textAlign: "center" }}>
                  <div style={{ height: "60px", width: "60px", borderRadius: "50%", background: "rgba(26,54,93,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", fontSize: "1.75rem", color: "var(--primary)" }}>💡</div>
                  <h4 style={{ fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.75rem" }}>Learn</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    Refine descriptions, identify business models, and outline product roadmaps through MInT AI assistance before submitting proposals.
                  </p>
                </div>

                <div className="card" style={{ padding: "2.5rem 1.75rem", textAlign: "center" }}>
                  <div style={{ height: "60px", width: "60px", borderRadius: "50%", background: "rgba(26,54,93,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto", fontSize: "1.75rem", color: "var(--primary)" }}>🚀</div>
                  <h4 style={{ fontSize: "1.25rem", color: "var(--primary)", marginBottom: "0.75rem" }}>Grow</h4>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                    Test products in our Sandbox environment, compile simulated containers, review logs, and qualify for national capital funding.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Testimonials Section (Grid Format with Ethiopian Representation) */}
          <section id="testimonials-section" className="section-padding" style={{ background: "var(--bg-app)" }}>
            <div className="container-centered">
              <h3 style={{ textAlign: "center", fontSize: "2.5rem", color: "var(--primary)", marginBottom: "1rem" }}>Founder Success Stories</h3>
              <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 4rem auto" }}>
                Read how tech builders are deploying real-world solutions across Ethiopia.
              </p>

              <div className="grid-3">
                {/* Profile 1: Meron Alemu (#C68642) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified Founder</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "The AI refinement diagnostics restructured our solar drip irrigation controller pitch completely. It saved us months of revisions and matched us with Oromia field cooperatives."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#C68642" gender="female" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Dr. Meron Alemu</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Founder, AgriGrow | Addis Ababa</div>
                    </div>
                  </div>
                </div>

                {/* Profile 2: Dawit Haile (#6B3E2E) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified CTO</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "Using the Sandbox build simulation, we verified offline payment gateway sync logs. Presenting these logs to the Central Bank's sandbox board expedited our clearance."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#6B3E2E" gender="male" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Prof. Dawit Haile</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>CTO, BirrFlow Wallet | Hawassa</div>
                    </div>
                  </div>
                </div>

                {/* Profile 3: Selam Tesfaye (#8B5A2B) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified Member</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "Finding clinical strategy advisors on the Mentorship hub was incredibly streamlined. We successfully bridged the gap between our university research and capital funding."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#8B5A2B" gender="female" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Selam Tesfaye</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Director, TenaConnect | Adama</div>
                    </div>
                  </div>
                </div>

                {/* Profile 4: Yonas Desta (#4A2511) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified Builder</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "MInT IIP gave my school management system platform direct exposure to the national grant committee. We secured seed capital to deploy tablets in 5 regional classrooms."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#4A2511" gender="male" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Yonas Desta</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Founder, EthioClass | Gondar</div>
                    </div>
                  </div>
                </div>

                {/* Profile 5: Kidist Hailu (#C68642) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified Scholar</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "Collaborating with the Ethiopian AI Institute through the CMU-Africa techskills program was seamless. The workspace matches graduate interns with real tasks."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#C68642" gender="female" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Kidist Hailu</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Data Scientist | Mekelle</div>
                    </div>
                  </div>
                </div>

                {/* Profile 6: Henok Mekonnen (#6B3E2E) */}
                <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "2rem" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <span style={{ color: "var(--secondary-dark)", fontWeight: 700 }}>⭐⭐⭐⭐⭐</span>
                      <span style={{ background: "#E6FFFA", color: "#319795", fontSize: "0.7rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "10px" }}>✓ Verified Dev</span>
                    </div>
                    <p style={{ fontSize: "0.92rem", fontStyle: "italic", color: "var(--text-muted)", marginBottom: "1.5rem", lineHeight: "1.6" }}>
                      "We integrated our micro-lending API prototype directly inside the IIP Sandbox logs and verified the Telebirr webhook. It's a highly functional development sandbox."
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-card)", paddingTop: "1rem" }}>
                    <UserAvatar skinColor="#6B3E2E" gender="male" />
                    <div>
                      <h4 style={{ fontSize: "0.95rem", color: "var(--primary)" }}>Henok Mekonnen</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Dev Lead, ChapaPay | Bahir Dar</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Partners Section (Grayscale logos turning to color on hover) */}
          <section id="partners-section" className="section-padding" style={{ background: "#FFFFFF", borderTop: "1px solid var(--border-card)" }}>
            <div className="container-centered">
              <h3 style={{ textAlign: "center", fontSize: "2.5rem", color: "var(--primary)", marginBottom: "1rem" }}>Trusted Collaborators</h3>
              <p style={{ textAlign: "center", color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto 4rem auto" }}>
                Accelerating digital transformation in partnership with leading local and international agencies.
              </p>

              <div className="partner-logo-grid" role="list">
                <PartnerLogoCard name="Ethiopian AI Institute" subtitle="Technical Advisor" logoTxt="🤖 EAII" hoverColor="#3182CE" />
                <PartnerLogoCard name="UNDP Ethiopia" subtitle="Grant Sponsor" logoTxt="🇺🇳 UNDP" hoverColor="#2B6CB0" />
                <PartnerLogoCard name="INSA" subtitle="Security Compliance" logoTxt="🛡️ INSA" hoverColor="#38A169" />
                <PartnerLogoCard name="M-Pesa Ethiopia" subtitle="Payment Gateway Provider" logoTxt="📲 M-PESA" hoverColor="#48BB78" />
              </div>
            </div>
          </section>

          {/* Auth Modal popup */}
          {isAuthModalOpen && (
            <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(26,54,93,0.4)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
              <div style={{ position: "relative", width: "100%", maxWidth: "480px", animation: "fadeInUp 0.3s ease" }}>
                <button
                  style={{ position: "absolute", top: "1rem", right: "1.5rem", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold", zIndex: 2010, color: "var(--text-muted)", background: "none", border: "none" }}
                  onClick={() => setIsAuthModalOpen(false)}
                  aria-label="Close Authentication Screen"
                >
                  &times;
                </button>
                <AuthPage onLoginSuccess={handleLoginSuccess} initialIsLogin={authModeIsLogin} />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* --- 2. Authenticated Portal Workspace --- */
        <div className="app-container">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentTheme={theme}
            toggleTheme={toggleTheme}
            onLogout={handleLogout}
          />
          <main className="main-content" role="main">
            {renderContent()}
          </main>
        </div>
      )}

      {/* Shared Footer (Pre and Post-Signup) */}
      <footer className="footer" role="contentinfo">
        <div className="container-centered" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "2.5rem", textAlign: "left", marginBottom: "3rem" }}>
          <div style={{ flex: "1.5", minWidth: "260px" }}>
            <img src="/mint_logo.jpg" alt="MInT Official Brand Logo" className="footer-logo" />
            <h4 style={{ color: "#FFFFFF", fontSize: "1.1rem", marginBottom: "0.75rem" }}>Ministry of Innovation & Technology</h4>
            <p style={{ color: "#CBD5E0", fontSize: "0.85rem", lineHeight: "1.6", maxWidth: "340px" }}>
              Empowering local tech builders by providing secure prototype environments, seed grants, and strategic mentor networks.
            </p>
          </div>
          
          <div style={{ flex: "1", minWidth: "150px" }}>
            <h4 style={{ color: "#FFFFFF", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Quick Links</h4>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li><a href="#about-section" className="footer-link">About IIP</a></li>
              <li><a href="#testimonials-section" className="footer-link">Startup Stories</a></li>
              <li><a href="#partners-section" className="footer-link">Our Partners</a></li>
            </ul>
          </div>

          <div style={{ flex: "1.5", minWidth: "260px" }}>
            <h4 style={{ color: "#FFFFFF", fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>Stay Updated</h4>
            <p style={{ color: "#CBD5E0", fontSize: "0.82rem", marginBottom: "1rem" }}>Subscribe to receive MInT calls for concept notes and startup challenge schedules.</p>
            {newsletterSuccess ? (
              <div style={{ background: "rgba(56, 161, 105, 0.15)", color: "#48BB78", padding: "0.5rem", borderRadius: "6px", fontSize: "0.82rem", fontWeight: 600 }}>
                ✓ Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  type="email"
                  placeholder="Enter email address"
                  className="form-control"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "#FFFFFF", fontSize: "0.82rem", minHeight: "36px" }}
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-accent" style={{ fontSize: "0.82rem", minHeight: "36px", padding: "0 1rem" }}>
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
          <p style={{ color: "#A0AEC0", fontSize: "0.78rem", margin: 0 }}>
            &copy; {new Date().getFullYear()} Ministry of Innovation and Technology, Ethiopia. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: "1.25rem" }}>
            <a href="https://linkedin.com" className="footer-link" aria-label="MInT LinkedIn Page">LinkedIn</a>
            <a href="https://twitter.com" className="footer-link" aria-label="MInT Twitter Profile">Twitter</a>
            <a href="https://youtube.com" className="footer-link" aria-label="MInT YouTube Channel">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
