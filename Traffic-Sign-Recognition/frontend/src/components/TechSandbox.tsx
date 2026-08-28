import React, { useState, useEffect, useRef } from "react";

export const TechSandbox: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [mvpName, setMvpName] = useState("");
  const [mvpDescription, setMvpDescription] = useState("");
  
  // Tech Stack state
  const [frontend, setFrontend] = useState("React (Vite)");
  const [backend, setBackend] = useState("FastAPI (Python)");
  const [database, setDatabase] = useState("PostgreSQL");

  // Terminal state
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [progress, setProgress] = useState(0);

  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const handleStartDeploy = () => {
    setIsDeploying(true);
    setIsDeployed(false);
    setLogs([]);
    setProgress(0);

    const mockLogs = [
      "🔄 Initializing MInT Sandbox Deployment Pipeline...",
      `📦 Setting up project directory for [${mvpName || "Unnamed MVP"}]`,
      `🔍 Selected Architecture Stack: Frontend: ${frontend} | Backend: ${backend} | DB: ${database}`,
      "🔨 Verifying dependencies and configurations...",
      "🐳 Generating Docker multi-stage build configurations...",
      "🐳 Building frontend distribution artifacts (npm run build)...",
      "🐳 [Docker] STEP 1/8: FROM node:20-alpine AS build",
      "🐳 [Docker] STEP 2/8: COPY frontend/package.json ./",
      "🐳 [Docker] STEP 3/8: RUN npm install && npm run build --minify",
      "✔️ Frontend compiled successfully (2.4s). Bundle size: 342KB.",
      "🐳 [Docker] STEP 4/8: FROM python:3.14-alpine",
      "🐳 [Docker] STEP 5/8: COPY backend/requirements.txt ./",
      "🐳 [Docker] STEP 6/8: RUN pip install --no-cache-dir -r requirements.txt",
      "✔️ Backend dependencies resolved.",
      "🐳 [Docker] STEP 7/8: COPY backend/app/ ./app",
      "🐳 [Docker] STEP 8/8: CMD [\"uvicorn\", \"app.main:app\", \"--host\", \"0.0.0.0\"]",
      "📦 Container images built successfully.",
      "🚀 Pushing images to MInT Private Artifact Registry (Addis Ababa East Region)...",
      "🚀 [Registry] Pushed: app-frontend:latest (32MB)",
      "🚀 [Registry] Pushed: app-backend:latest (120MB)",
      "🏗️ Provisioning Serverless Container instances on MInT Cloud Sandbox...",
      `🗄️ Allocating managed ${database} schema container...`,
      "🌐 Allocating SSL certificates for secure HTTPS gateway routing...",
      "⏳ Waiting for container health checks to pass (GET /health)...",
      "🟢 Health check status: 200 OK (FastAPI up)",
      "🎉 Deployment Complete! Standard domain bound successfully.",
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < mockLogs.length) {
        setLogs((prev) => [...prev, mockLogs[logIndex]]);
        setProgress((prev) => Math.min(prev + Math.floor(100 / mockLogs.length), 100));
        logIndex++;
      } else {
        clearInterval(interval);
        setIsDeploying(false);
        setIsDeployed(true);
        setProgress(100);
        const nameSlug = (mvpName || "app").toLowerCase().replace(/[^a-z0-9]/g, "-");
        setDeploymentUrl(`https://${nameSlug}-sandbox.mint.gov.et`);
      }
    }, 450); // Speed of logs printing
  };

  const handleReset = () => {
    setActiveStep(1);
    setMvpName("");
    setMvpDescription("");
    setLogs([]);
    setIsDeploying(false);
    setIsDeployed(false);
    setDeploymentUrl("");
    setProgress(0);
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", color: "var(--primary)" }}>Technical Sandbox</h2>
        <p style={{ color: "var(--text-muted)" }}>
          Validate code stack structures and deploy simulated Minimum Viable Products (MVPs) in a guided environment.
        </p>
      </div>

      {/* Wizard steps indicator */}
      <div className="card" style={{ marginBottom: "2rem" }}>
        <div className="wizard-steps" style={{ maxWidth: "400px", margin: "0 auto" }}>
          <div className={`wizard-step ${activeStep >= 1 ? "active" : ""}`}>1</div>
          <div className={`wizard-step ${activeStep >= 2 ? "active" : ""}`}>2</div>
          <div className={`wizard-step ${activeStep >= 3 ? "active" : ""}`}>3</div>
        </div>
      </div>

      {activeStep === 1 && (
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>Step 1: MVP Core Specifications</h3>
          <div className="form-group">
            <label>MVP Prototype Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. AgriGrow IoT Portal"
              value={mvpName}
              onChange={(e) => setMvpName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Functional Description (What features to test?)</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="e.g. Test Soil sensor HTTP posting and dashboard rendering."
              value={mvpDescription}
              onChange={(e) => setMvpDescription(e.target.value)}
              required
            ></textarea>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => setActiveStep(2)}
            disabled={!mvpName || !mvpDescription}
          >
            Configure Tech Stack
          </button>
        </div>
      )}

      {activeStep === 2 && (
        <div className="card" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>Step 2: Stack Configuration</h3>
          <div className="form-group">
            <label>Frontend Framework</label>
            <select
              className="form-control"
              value={frontend}
              onChange={(e) => setFrontend(e.target.value)}
              style={{ background: "var(--bg-app)", color: "var(--text-main)" }}
            >
              <option value="React (Vite)">React (Vite + TypeScript)</option>
              <option value="Next.js">Next.js (App Router)</option>
              <option value="HTML5/JS">Vanilla JS (Single Page)</option>
              <option value="Flutter Web">Flutter Web App</option>
            </select>
          </div>

          <div className="form-group">
            <label>Backend API Core</label>
            <select
              className="form-control"
              value={backend}
              onChange={(e) => setBackend(e.target.value)}
              style={{ background: "var(--bg-app)", color: "var(--text-main)" }}
            >
              <option value="FastAPI (Python)">FastAPI (Python 3.14)</option>
              <option value="Node.js (Express)">Node.js (Express + Express-Validator)</option>
              <option value="Go Fiber">Go (Fiber Web Framework)</option>
              <option value="None">None (Frontend only / Firebase)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Database Engine</label>
            <select
              className="form-control"
              value={database}
              onChange={(e) => setDatabase(e.target.value)}
              style={{ background: "var(--bg-app)", color: "var(--text-main)" }}
            >
              <option value="PostgreSQL">PostgreSQL (Relational)</option>
              <option value="SQLite">SQLite (Embedded / Testing)</option>
              <option value="MongoDB">MongoDB (Document / NoSQL)</option>
            </select>
          </div>

          <div style={{ background: "rgba(15, 41, 99, 0.05)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)", padding: "1rem", marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.85rem", color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
              Suggested DB Schema Architecture
            </h4>
            <pre style={{ fontSize: "0.75rem", overflowX: "auto", fontFamily: "monospace" }}>
              {database === "PostgreSQL" || database === "SQLite" ? (
                `CREATE TABLE dev_project (\n  id SERIAL PRIMARY KEY,\n  name VARCHAR(100) NOT NULL,\n  status VARCHAR(20) DEFAULT 'draft',\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\nCREATE TABLE metrics_payload (\n  id SERIAL PRIMARY KEY,\n  project_id INT REFERENCES dev_project(id),\n  metric_value NUMERIC(10,2),\n  timestamp TIMESTAMP\n);`
              ) : (
                `db.dev_projects.insertMany([\n  { name: "${mvpName || "My Project"}", status: "draft", metrics: [] }\n]);`
              )}
            </pre>
          </div>

          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveStep(1)}>
              Back
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setActiveStep(3); handleStartDeploy(); }}>
              Provision Sandbox
            </button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <div className="card" style={{ maxWidth: "700px", margin: "0 auto" }}>
          <h3 style={{ marginBottom: "1rem", color: "var(--primary)" }}>Step 3: Sandbox Deploy Terminal</h3>
          
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
            <span>Deploying: **{mvpName}**</span>
            <span>Progress: {progress}%</span>
          </div>

          {/* Progress bar */}
          <div className="chart-bar-bg" style={{ height: "8px", marginBottom: "1.5rem" }}>
            <div className="chart-bar-fill" style={{ width: `${progress}%` }}></div>
          </div>

          <div className="terminal-window">
            {logs.map((log, index) => (
              <div key={index} className="terminal-line">
                {log}
              </div>
            ))}
            {isDeploying && <div className="terminal-line" style={{ color: "var(--accent)" }}>▋ Compiling assets...</div>}
            <div ref={terminalEndRef}></div>
          </div>

          {isDeployed && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)", textAlign: "center" }}>
              <div style={{ fontWeight: 600, color: "var(--success)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                🚀 Sandbox Container Live!
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-main)", marginBottom: "1rem" }}>
                Your project container has successfully initialized in the MInT Sandbox cluster.
              </p>
              <a
                href={deploymentUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-accent"
                style={{ color: "#000000", padding: "0.5rem 1rem", fontSize: "0.85rem", display: "inline-flex" }}
              >
                Open Sandboxed Prototype App 🌐
              </a>
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveStep(2)} disabled={isDeploying}>
              Back
            </button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReset} disabled={isDeploying}>
              Deploy Another MVP
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
