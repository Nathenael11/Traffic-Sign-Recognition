import React, { useEffect, useState } from "react";
import { api } from "../utils/api";

export const IdeaPortal: React.FC = () => {
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null);
  
  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  
  // Submit Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("General");
  const [problemStatement, setProblemStatement] = useState("");
  const [businessModel, setBusinessModel] = useState("");
  
  // AI Refiner states
  const [isRefining, setIsRefining] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [activeStep, setActiveStep] = useState(1); // Step 1: Raw, Step 2: AI Refine, Step 3: Details

  // Review states
  const [commentContent, setCommentContent] = useState("");
  const [rating, setRating] = useState(5);
  const [actionError, setActionError] = useState("");

  // Filters
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const userRole = api.getCurrentUserRole();

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const data = await api.getInnovations();
      setIdeas(data);
    } catch (e) {
      console.error("Error loading ideas", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, []);

  const handleRefine = async () => {
    if (!description) return;
    setIsRefining(true);
    setActionError("");
    try {
      const result = await api.refineInnovation(description, title);
      setAiResult(result);
      setActiveStep(2);
    } catch (e: any) {
      setActionError(e.message || "Failed to refine idea. Make sure the backend is running.");
    } finally {
      setIsRefining(false);
    }
  };

  const acceptAiRefinement = () => {
    if (!aiResult) return;
    setTitle(aiResult.refined_title);
    setDescription(aiResult.refined_description);
    setCategory(aiResult.category);
    setProblemStatement(`Market Potential: ${aiResult.market_potential}`);
    setBusinessModel(`Suggested Features: ${aiResult.suggested_features.join(", ")}`);
    setActiveStep(3);
  };

  const handleSubmitIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError("");
    try {
      await api.createInnovation({
        title,
        description,
        category,
        problem_statement: problemStatement,
        business_model: businessModel
      });
      setIsSubmitModalOpen(false);
      resetSubmitForm();
      loadIdeas();
    } catch (err: any) {
      setActionError(err.message || "Error submitting proposal.");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedIdea) return;
    try {
      const updated = await api.updateInnovationStatus(selectedIdea.id, newStatus);
      setSelectedIdea(updated);
      loadIdeas();
    } catch (err: any) {
      alert(err.message || "Error updating status.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIdea || !commentContent) return;
    try {
      const newComment = await api.addComment(selectedIdea.id, commentContent, rating);
      setSelectedIdea({
        ...selectedIdea,
        comments: [...selectedIdea.comments, newComment]
      });
      setCommentContent("");
      loadIdeas();
    } catch (err: any) {
      alert(err.message || "Error adding comment.");
    }
  };

  const resetSubmitForm = () => {
    setTitle("");
    setDescription("");
    setCategory("General");
    setProblemStatement("");
    setBusinessModel("");
    setAiResult(null);
    setActiveStep(1);
    setActionError("");
  };

  const filteredIdeas = ideas.filter((idea) => {
    const matchesCategory = filterCategory === "All" || idea.category === filterCategory;
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h2 style={{ fontSize: "2rem", color: "var(--primary)" }}>Innovations Hub</h2>
          <p style={{ color: "var(--text-muted)" }}>Explore, review, and support breakthrough technology proposals.</p>
        </div>
        {userRole === "innovator" && (
          <button className="btn btn-accent" onClick={() => setIsSubmitModalOpen(true)}>
            Submit New Idea
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "2rem", padding: "1rem" }}>
        <input
          type="text"
          placeholder="Search ideas..."
          className="form-control"
          style={{ flex: 1, minWidth: "200px" }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="form-control"
          style={{ width: "200px", background: "var(--bg-app)", color: "var(--text-main)" }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="All">All Categories</option>
          <option value="Agri-Tech">Agri-Tech</option>
          <option value="Fintech">Fintech</option>
          <option value="Health-Tech">Health-Tech</option>
          <option value="Edu-Tech">Edu-Tech</option>
          <option value="General">General</option>
        </select>
      </div>

      {/* Grid of Ideas */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading proposals...</div>
      ) : filteredIdeas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>No ideas found matching filters.</div>
      ) : (
        <div className="grid-3">
          {filteredIdeas.map((idea) => (
            <div key={idea.id} className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }} onClick={() => setSelectedIdea(idea)}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <span className="keyword-tag" style={{ margin: 0 }}>{idea.category}</span>
                  <span className={`status-badge status-${idea.status}`}>{idea.status}</span>
                </div>
                <h3 style={{ fontSize: "1.2rem", margin: "0.5rem 0", color: "var(--primary)" }}>{idea.title}</h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "1rem" }}>
                  {idea.description}
                </p>
              </div>
              <div style={{ borderTop: "1px solid var(--border-card)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <span>By: **{idea.creator_username}**</span>
                <span>💬 {idea.comments?.length || 0} reviews</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Idea Detail Modal */}
      {selectedIdea && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem" }}>
          <div className="card" style={{ maxWidth: "700px", width: "100%", maxHeight: "85vh", overflowY: "auto", position: "relative", padding: "2rem" }}>
            <span style={{ position: "absolute", top: "1rem", right: "1rem", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }} onClick={() => setSelectedIdea(null)}>
              &times;
            </span>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <span className="keyword-tag">{selectedIdea.category}</span>
              <span className={`status-badge status-${selectedIdea.status}`}>{selectedIdea.status}</span>
            </div>

            <h3 style={{ fontSize: "1.75rem", marginBottom: "1rem", color: "var(--primary)" }}>{selectedIdea.title}</h3>
            
            <div style={{ marginBottom: "1.5rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Submitted by **{selectedIdea.creator_username}** on {new Date(selectedIdea.created_at).toLocaleDateString()}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--primary)" }}>Project Concept</h4>
              <p style={{ fontSize: "0.95rem" }}>{selectedIdea.description}</p>
            </div>

            {selectedIdea.problem_statement && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--primary)" }}>Problem Statement</h4>
                <p style={{ fontSize: "0.95rem" }}>{selectedIdea.problem_statement}</p>
              </div>
            )}

            {selectedIdea.business_model && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.5rem", color: "var(--primary)" }}>Business Model</h4>
                <p style={{ fontSize: "0.95rem" }}>{selectedIdea.business_model}</p>
              </div>
            )}

            {selectedIdea.ai_feedback && (
              <div className="ai-enhanced-panel" style={{ marginBottom: "2rem" }}>
                <h4 style={{ color: "var(--accent-dark)", fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.5rem" }}>
                  MInT AI Advisor Feedback
                </h4>
                <p style={{ fontSize: "0.88rem", fontStyle: "italic" }}>{selectedIdea.ai_feedback}</p>
              </div>
            )}

            {/* Admin/Mentor Controls */}
            {["admin", "mentor"].includes(userRole) && (
              <div style={{ borderTop: "1px solid var(--border-card)", paddingTop: "1.5rem", marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "1rem", marginBottom: "0.75rem" }}>Update Project Lifecycle Stage</h4>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button className="btn btn-outline" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem" }} onClick={() => handleStatusChange("reviewing")}>Set Under Review</button>
                  <button className="btn btn-primary" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem" }} onClick={() => handleStatusChange("incubating")}>Set Incubating</button>
                  <button className="btn btn-accent" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "#000000" }} onClick={() => handleStatusChange("funded")}>Approve Funding</button>
                  <button className="btn btn-outline" style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", borderColor: "var(--error)", color: "var(--error)" }} onClick={() => handleStatusChange("rejected")}>Reject</button>
                </div>
              </div>
            )}

            {/* Comments/Review Section */}
            <div style={{ borderTop: "1px solid var(--border-card)", paddingTop: "1.5rem" }}>
              <h4 style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>Expert Peer Reviews ({selectedIdea.comments?.length || 0})</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
                {selectedIdea.comments?.map((c: any) => (
                  <div key={c.id} style={{ background: "rgba(0,0,0,0.02)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-sm)", padding: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 600 }}>🎓 Mentor: {c.author_username}</span>
                      <span style={{ color: "var(--accent-dark)" }}>{"⭐".repeat(c.rating || 5)}</span>
                    </div>
                    <p style={{ fontSize: "0.88rem" }}>{c.content}</p>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem", textAlign: "right" }}>
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Comment Form */}
              {["admin", "mentor"].includes(userRole) && (
                <form onSubmit={handleAddComment}>
                  <div className="form-group">
                    <label>Write Mentor Recommendation</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Add technical advice, suggested connections or regulatory tips..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <label style={{ margin: 0, textTransform: "none", fontSize: "0.85rem" }}>Rating:</label>
                      <select className="form-control" style={{ width: "70px", padding: "0.3rem" }} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                        <option value="5">5 ⭐</option>
                        <option value="4">4 ⭐</option>
                        <option value="3">3 ⭐</option>
                        <option value="2">2 ⭐</option>
                        <option value="1">1 ⭐</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                      Submit Review
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit New Idea Modal */}
      {isSubmitModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000, padding: "1.5rem" }}>
          <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "2rem" }}>
            <span style={{ position: "absolute", top: "1rem", right: "1rem", cursor: "pointer", fontSize: "1.5rem", fontWeight: "bold" }} onClick={() => { setIsSubmitModalOpen(false); resetSubmitForm(); }}>
              &times;
            </span>

            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "var(--primary)" }}>Submit Innovation Concept</h3>

            {/* Steps indicator */}
            <div className="wizard-steps">
              <div className={`wizard-step ${activeStep >= 1 ? "active" : ""}`}>1</div>
              <div className={`wizard-step ${activeStep >= 2 ? "active" : ""}`}>2</div>
              <div className={`wizard-step ${activeStep >= 3 ? "active" : ""}`}>3</div>
            </div>

            {actionError && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--error)", padding: "0.75rem", borderRadius: "var(--radius-sm)", marginBottom: "1rem", fontSize: "0.85rem" }}>
                {actionError}
              </div>
            )}

            {/* Step 1: Input Raw Pitch */}
            {activeStep === 1 && (
              <div>
                <div className="form-group">
                  <label>Working Project Title (Optional)</label>
                  <input type="text" className="form-control" placeholder="e.g. Agri-ledger App" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Raw Idea Description (Describe in 1-2 paragraphs)</label>
                  <textarea
                    rows={6}
                    className="form-control"
                    placeholder="Describe what you want to build, what problem it solves, and who it helps in Ethiopia..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button
                  type="button"
                  className="btn btn-accent"
                  style={{ width: "100%", color: "#000000" }}
                  onClick={handleRefine}
                  disabled={isRefining || !description}
                >
                  {isRefining ? "AI is refining concept..." : "Optimize with MInT AI"}
                </button>
              </div>
            )}

            {/* Step 2: AI Refinement review */}
            {activeStep === 2 && aiResult && (
              <div>
                <div className="ai-enhanced-panel" style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "var(--accent-dark)", fontSize: "0.95rem", marginBottom: "0.75rem" }}>
                    ✨ AI Enhancement Output
                  </h4>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong>Refined Title:</strong> {aiResult.refined_title}
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong>Suggested Category:</strong> <span className="keyword-tag">{aiResult.category}</span>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong>Refined Concept:</strong>
                    <p style={{ fontSize: "0.88rem", marginTop: "0.25rem", color: "var(--text-main)" }}>{aiResult.refined_description}</p>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong>Key Focus Area Tags:</strong>
                    <div style={{ marginTop: "0.25rem" }}>
                      {aiResult.extracted_keywords.map((kw: string) => (
                        <span key={kw} className="keyword-tag" style={{ fontSize: "0.75rem" }}>{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <strong>Market Potential in Ethiopia:</strong>
                    <p style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>{aiResult.market_potential}</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveStep(1)}>
                    Back to Edit
                  </button>
                  <button className="btn btn-accent" style={{ flex: 1, color: "#000000" }} onClick={acceptAiRefinement}>
                    Apply AI Pitch
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Complete Details & Submit */}
            {activeStep === 3 && (
              <form onSubmit={handleSubmitIdea}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} style={{ background: "var(--bg-app)", color: "var(--text-main)" }}>
                    <option value="Agri-Tech">Agri-Tech</option>
                    <option value="Fintech">Fintech</option>
                    <option value="Health-Tech">Health-Tech</option>
                    <option value="Edu-Tech">Edu-Tech</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Project Proposal Summary</label>
                  <textarea rows={4} className="form-control" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                </div>
                <div className="form-group">
                  <label>Problem Statement</label>
                  <textarea rows={3} className="form-control" placeholder="Describe the specific gap this project closes..." value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)}></textarea>
                </div>
                <div className="form-group">
                  <label>Business / Sustainability Model</label>
                  <textarea rows={3} className="form-control" placeholder="How will this project support itself or monetize?" value={businessModel} onChange={(e) => setBusinessModel(e.target.value)}></textarea>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setActiveStep(2)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    Submit Proposal
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
