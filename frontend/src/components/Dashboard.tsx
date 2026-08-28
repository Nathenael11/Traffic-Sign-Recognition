import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalIdeas: 0,
    incubating: 0,
    mentorsCount: 0,
    grantsCount: 0,
  });
  const [sectorCounts, setSectorCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ideas, mentors, grants] = await Promise.all([
          api.getInnovations(),
          api.getMentors(),
          api.getGrants(),
        ]);

        const incubatingCount = ideas.filter(
          (i: any) => i.status === "incubating" || i.status === "funded"
        ).length;

        // Calculate counts per sector
        const sectors: { [key: string]: number } = {
          "Agri-Tech": 0,
          "Fintech": 0,
          "Health-Tech": 0,
          "Edu-Tech": 0,
          "General": 0,
        };
        ideas.forEach((i: any) => {
          const cat = i.category || "General";
          if (sectors[cat] !== undefined) {
            sectors[cat]++;
          } else {
            sectors["General"]++;
          }
        });

        setStats({
          totalIdeas: ideas.length,
          incubating: incubatingCount,
          mentorsCount: mentors.length,
          grantsCount: grants.length,
        });
        setSectorCounts(sectors);
      } catch (e) {
        console.error("Error fetching dashboard stats", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--text-muted)" }}>
          Loading dashboard insights...
        </div>
      </div>
    );
  }

  // Calculate percentages for SVG rendering
  const maxCount = Math.max(...Object.values(sectorCounts), 1);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "2rem", color: "var(--primary)" }}>Incubator Overview</h2>
        <p style={{ color: "var(--text-muted)" }}>
          National performance indicators and analytics for MInT tech initiatives.
        </p>
      </div>

      {/* Stats Widgets */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        <div className="card stat-widget">
          <div className="stat-icon">💡</div>
          <div>
            <div className="stat-value">{stats.totalIdeas}</div>
            <div className="stat-label">Total Ideas</div>
          </div>
        </div>

        <div className="card stat-widget">
          <div className="stat-icon">🚀</div>
          <div>
            <div className="stat-value">{stats.incubating}</div>
            <div className="stat-label">Incubating & Funded</div>
          </div>
        </div>

        <div className="card stat-widget">
          <div className="stat-icon">🎓</div>
          <div>
            <div className="stat-value">{stats.mentorsCount}</div>
            <div className="stat-label">Expert Mentors</div>
          </div>
        </div>

        <div className="card stat-widget">
          <div className="stat-icon">💰</div>
          <div>
            <div className="stat-value">{stats.grantsCount}</div>
            <div className="stat-label">Funding Programs</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Sector breakdown chart */}
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
            Innovations by Sector
          </h3>
          <div className="chart-container">
            {Object.entries(sectorCounts).map(([sector, count]) => {
              const percentage = (count / maxCount) * 100;
              return (
                <div key={sector} className="chart-bar-row">
                  <div className="chart-bar-label">{sector}</div>
                  <div className="chart-bar-bg">
                    <div
                      className="chart-bar-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="chart-bar-val">{count}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent updates list */}
        <div className="card">
          <h3 style={{ marginBottom: "1.5rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
            Incubator Log Activities
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
              <div style={{ fontSize: "1.25rem" }}>🆕</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>New Application Submitted</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Innovator abdi_m applied for **MInT National Innovation Grant 2026** with *EcoIrrigate Ethiopia*.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", borderBottom: "1px solid var(--border-card)", paddingBottom: "0.5rem" }}>
              <div style={{ fontSize: "1.25rem" }}>💬</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Mentor Feedback Added</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Mentor dawit_a reviewed *EcoIrrigate Ethiopia* and left recommendation comments.
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <div style={{ fontSize: "1.25rem" }}>🏆</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Incubation Stage Advanced</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  *EcoIrrigate Ethiopia* status was moved to **Incubating** by administrator.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
