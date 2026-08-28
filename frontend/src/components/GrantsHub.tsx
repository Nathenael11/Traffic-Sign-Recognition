import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

export const GrantsHub: React.FC = () => {
  const [grants, setGrants] = useState<any[]>([]);
  const [myIdeas, setMyIdeas] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply form state
  const [applyingGrant, setApplyingGrant] = useState<any | null>(null);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userRole = api.getCurrentUserRole();
  const username = api.getCurrentUsername();

  const loadData = async () => {
    setLoading(true);
    try {
      const [grantsData, ideasData] = await Promise.all([
        api.getGrants(),
        api.getInnovations(),
      ]);
      setGrants(grantsData);
      
      // Filter ideas belonging to the logged-in innovator
      const ownedIdeas = ideasData.filter((i: any) => i.creator_username === username);
      setMyIdeas(ownedIdeas);

      if (api.isAuthenticated()) {
        const apps = await api.getGrantApplications();
        setMyApplications(apps);
      }
    } catch (e) {
      console.error("Error loading grants data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingGrant || !selectedIdeaId) return;
    
    setIsSubmitting(true);
    setApplyError("");
    setApplySuccess(false);

    try {
      await api.applyForGrant(applyingGrant.id, Number(selectedIdeaId));
      setApplySuccess(true);
      setSelectedIdeaId("");
      loadData();
      setTimeout(() => {
        setApplySuccess(false);
        setApplyingGrant(null);
      }, 2000);
    } catch (err: any) {
      setApplyError(err.message || "Failed to submit grant application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", color: "var(--primary)" }}>Funding & Grants Hub</h2>
        <p style={{ color: "var(--text-muted)" }}>Access national capital funds, private venture capital, and local innovation grants.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading grants database...</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          
          {/* Tracker (only for Innovators/Admins who have applications) */}
          {api.isAuthenticated() && myApplications.length > 0 && (
            <div className="card">
              <h3 style={{ marginBottom: "1rem", color: "var(--primary)", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
                My Applications Status
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-card)", color: "var(--text-muted)" }}>
                      <th style={{ padding: "0.75rem" }}>Grant Program</th>
                      <th style={{ padding: "0.75rem" }}>Project Proposal</th>
                      <th style={{ padding: "0.75rem" }}>Date Applied</th>
                      <th style={{ padding: "0.75rem" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myApplications.map((app) => (
                      <tr key={app.id} style={{ borderBottom: "1px solid var(--border-card)" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 600 }}>{app.grant_title}</td>
                        <td style={{ padding: "0.75rem" }}>{app.innovation_title}</td>
                        <td style={{ padding: "0.75rem" }}>{new Date(app.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <span className={`status-badge status-${app.status}`}>{app.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* List of Grants */}
          <div>
            <h3 style={{ marginBottom: "1.5rem", color: "var(--primary)" }}>Available Funding Programs</h3>
            <div className="grid-3">
              {grants.map((grant) => (
                <div key={grant.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <span className="keyword-tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)" }}>
                        Open Application
                      </span>
                      <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--success)" }}>
                        {grant.amount.toLocaleString(undefined, { style: "currency", currency: "ETB", maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <h4 style={{ fontSize: "1.1rem", color: "var(--primary)", margin: "0.5rem 0" }}>{grant.title}</h4>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem", minHeight: "80px" }}>
                      {grant.description}
                    </p>

                    <div style={{ fontSize: "0.8rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>
                      🏢 **Provider**: {grant.provider}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                      🗓️ **Deadline**: {grant.deadline}
                    </div>
                  </div>

                  {userRole === "innovator" && (
                    <button
                      className="btn btn-accent"
                      style={{ width: "100%", color: "#000000", fontSize: "0.85rem" }}
                      onClick={() => setApplyingGrant(grant)}
                      disabled={myIdeas.length === 0}
                      title={myIdeas.length === 0 ? "You need to submit an innovation idea first before applying" : ""}
                    >
                      Apply Now
                    </button>
                  )}
                  
                  {userRole !== "innovator" && (
                    <div style={{ textAlign: "center", fontSize: "0.78rem", fontStyle: "italic", color: "var(--text-muted)", background: "rgba(0,0,0,0.02)", padding: "0.5rem", borderRadius: "var(--radius-sm)" }}>
                      Open to registered Innovators
                    </div>
                  )}
                </div>
              ))}
            </div>
            {userRole === "innovator" && myIdeas.length === 0 && (
              <div style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--error)", background: "rgba(239, 68, 68, 0.05)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                💡 **Notice**: You have not submitted any ideas yet in the [Idea Hub]. Create an idea first to become eligible for grant applications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Modal */}
      {applyingGrant && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: "450px", width: "100%", padding: "2rem" }}>
            <h3>Apply for Capital Fund</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Submitting application to **{applyingGrant.title}**
            </p>

            {applySuccess ? (
              <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", padding: "1rem", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "0.9rem" }}>
                ✔️ **Application Submitted!**<br />
                MInT administrators will review your project specs. Track status in your dashboard.
              </div>
            ) : (
              <form onSubmit={handleApplySubmit}>
                {applyError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "0.5rem", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                    {applyError}
                  </div>
                )}
                
                <div className="form-group">
                  <label>Select Project to Pitch</label>
                  <select
                    className="form-control"
                    value={selectedIdeaId}
                    onChange={(e) => setSelectedIdeaId(e.target.value)}
                    required
                    style={{ background: "var(--bg-app)", color: "var(--text-main)" }}
                  >
                    <option value="">Choose proposal...</option>
                    {myIdeas.map((idea) => (
                      <option key={idea.id} value={idea.id}>
                        {idea.title} ({idea.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ background: "rgba(0,0,0,0.02)", padding: "0.75rem", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>
                  ℹ️ Submitting this form links your project's detailed proposal, problem statement, and AI enhancement metrics directly to the review board.
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setApplyingGrant(null)} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-accent" style={{ flex: 1, color: "#000000" }} disabled={isSubmitting || !selectedIdeaId}>
                    {isSubmitting ? "Submitting..." : "Submit Pitch"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
