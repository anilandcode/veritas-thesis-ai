"use client";

import React, { useState, useEffect } from "react";

interface TimelineLog {
  id: number;
  thesis_id: number;
  section_key: string;
  action: string;
  draft_text?: string;
  character_count: number;
  plagiarism_index: number;
  synthesis_count: number;
  verification_sig: string;
  created_at: string;
}

interface OutlineItem {
  id: number;
  thesis_id: number;
  section_title: string;
  section_key: string;
  guiding_hints?: string;
  status: string;
  draft_text: string;
  created_at: string;
  updated_at: string;
}

interface VerificationReport {
  student_email: string;
  thesis_title: string;
  topic_description: string;
  section_key: string;
  verification_sig: string;
  timeline: TimelineLog[];
  outline: OutlineItem[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function SupervisorVerifyPortal() {
  const [sigCode, setSigCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [activeTab, setActiveTab] = useState<string>("");

  // Handle URL signature code queries if present on load (e.g. /verify?sig=...)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlSig = params.get("sig");
      if (urlSig) {
        setSigCode(urlSig);
        handleVerifySignature(urlSig);
      }
    }
  }, []);

  // Sync active inspect tab to first outline section when report changes
  useEffect(() => {
    if (report && report.outline.length > 0) {
      setActiveTab(report.outline[0].section_key);
    }
  }, [report]);

  const handleVerifySignature = async (codeToVerify?: string) => {
    const code = codeToVerify || sigCode.trim();
    if (!code) {
      setError("Please enter a valid certificate signature code");
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);

    try {
      // Slashes are natively handled due to backend `{sig_code:path}` routing
      const encodedCode = encodeURIComponent(code);
      const res = await fetch(`${BACKEND_URL}/thesis/verify-certificate/${encodedCode}`);
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Certificate verification failed. Signature not found.");
      }

      const data: VerificationReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "An unexpected connection error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "save_draft":
        return "Autosaved Draft Section";
      case "unlock_section":
        return "Socratic Verification Pass (Unlocked Next Section)";
      case "audit_failure":
        return "Socratic Gating Gate: Audit Failed";
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "unlock_section":
        return "var(--accent-green)";
      case "audit_failure":
        return "var(--accent-red)";
      default:
        return "var(--accent-cyan)";
    }
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "var(--bg-main)",
      backgroundImage: "var(--grad-dark)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-sans)",
      padding: "32px 16px",
      overflowY: "auto"
    }}>
      
      {/* Premium Header */}
      <header style={{
        maxWidth: "1200px",
        margin: "0 auto 32px auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "var(--grad-primary)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)"
          }}>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "white" }}>V</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              VERITAS <span className="text-gradient">AI</span>
            </h1>
            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              B2B Authorship Verification Portal
            </span>
          </div>
        </div>
        <a 
          href="/"
          className="btn btn-secondary"
          style={{ textDecoration: "none", fontSize: "0.75rem", padding: "8px 16px" }}
        >
          Return to Workspace
        </a>
      </header>

      {/* Main Core Layout Grid */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Search Drawer Panel */}
        <section className="glass" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
            Verify Academic Authorship
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Paste the progress signature code generated from a student's Authorship Progress Ledger. 
            Veritas AI will retrieve the immutable audit trail verifying step-by-step drafting milestones.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <input 
              type="text"
              placeholder="e.g. VERITAS-AUTH-SIG-28710209-5/24/2026"
              value={sigCode}
              onChange={(e) => setSigCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerifySignature()}
              style={{
                flex: 1,
                minWidth: "280px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-sm)",
                padding: "12px 16px",
                color: "white",
                fontSize: "0.88rem",
                fontFamily: "monospace",
                outline: "none",
                transition: "all 0.3s ease"
              }}
            />
            <button
              onClick={() => handleVerifySignature()}
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "12px 28px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--grad-primary)",
                boxShadow: "var(--shadow-glow)",
                opacity: loading ? 0.7 : 1,
                transition: "all 0.3s ease"
              }}
            >
              {loading ? "Locating Certificate..." : "Verify Progress Certificate"}
            </button>
          </div>

          {error && (
            <div className="glass" style={{
              marginTop: "20px",
              padding: "14px 18px",
              borderRadius: "var(--radius-sm)",
              borderLeft: "4px solid var(--accent-red)",
              background: "rgba(239, 68, 68, 0.05)",
              color: "white",
              fontSize: "0.82rem"
            }}>
              ⚠️ <strong>Audit Error:</strong> {error}
            </div>
          )}
        </section>

        {report && (
          <div className="verify-grid">
            
            {/* Left Side: Student Profile & Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* Profile Details Card */}
              <section className="glass" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Identity Audited Successfully
                    </span>
                    <h3 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "4px 0 8px 0" }}>
                      {report.thesis_title}
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      Student Email: <strong style={{ color: "white" }}>{report.student_email}</strong>
                    </p>
                  </div>
                  <div style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1.5px solid var(--accent-green)",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    boxShadow: "0 0 15px rgba(16, 185, 129, 0.2)"
                  }}>
                    <span style={{ width: "8px", height: "8px", background: "var(--accent-green)", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }}></span>
                    Authorship Authenticated
                  </div>
                </div>

                <div style={{
                  background: "rgba(0,0,0,0.2)",
                  padding: "16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  marginBottom: "20px"
                }}>
                  <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Research Topic & Concept
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {report.topic_description}
                  </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  <div>
                    Certificate Key: <code style={{ color: "var(--accent-cyan)", fontFamily: "monospace" }}>{report.verification_sig.split("-")[3] || "N/A"}</code>
                  </div>
                  <div>
                    Synthesized Facts: <strong style={{ color: "white" }}>{report.timeline.filter(t => t.action === "unlock_section").length} Locked Gates Cleared</strong>
                  </div>
                </div>
              </section>

              {/* Tabbed Interactive Section Draft Inspector */}
              <section className="glass" style={{ padding: "28px", borderRadius: "var(--radius-lg)" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  📂 Student Outline Drafts Inspector
                </h3>

                {/* Tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "4px", marginBottom: "20px", overflowX: "auto" }}>
                  {report.outline.map((item) => (
                    <button
                      key={item.section_key}
                      onClick={() => setActiveTab(item.section_key)}
                      style={{
                        padding: "10px 16px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        color: activeTab === item.section_key ? "var(--accent-cyan)" : "var(--text-muted)",
                        borderBottom: activeTab === item.section_key ? "2.5px solid var(--accent-cyan)" : "2px solid transparent",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {item.section_title}
                    </button>
                  ))}
                </div>

                {/* Inspect Content */}
                {report.outline.map((item) => {
                  if (item.section_key !== activeTab) return null;

                  // Find latest unlock or save for this section to inspect details
                  const logs = report.timeline.filter(t => t.section_key === item.section_key);
                  const latestLog = logs[logs.length - 1];

                  return (
                    <div key={item.section_key} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Section Status</span>
                          <strong style={{ display: "block", fontSize: "0.88rem", color: item.status === "Completed" ? "var(--accent-green)" : "var(--accent-amber)", marginTop: "4px" }}>
                            {item.status}
                          </strong>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Draft Length</span>
                          <strong style={{ display: "block", fontSize: "0.88rem", color: "white", marginTop: "4px" }}>
                            {item.draft_text.length} characters
                          </strong>
                        </div>
                        <div style={{ background: "rgba(0,0,0,0.15)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Local Plagiarism Risk</span>
                          <strong style={{ display: "block", fontSize: "0.88rem", color: (latestLog?.plagiarism_index || 0) >= 0.30 ? "var(--accent-amber)" : "var(--accent-green)", marginTop: "4px" }}>
                            {((latestLog?.plagiarism_index || 0) * 100).toFixed(1)}% ({latestLog?.plagiarism_index >= 0.30 ? "Moderate" : "Low"})
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <strong style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                          Draft Text Content
                        </strong>
                        <div style={{
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "20px",
                          fontSize: "0.88rem",
                          lineHeight: "1.6",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          maxHeight: "350px",
                          overflowY: "auto"
                        }}>
                          {item.draft_text || (
                            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                              No draft content has been submitted or saved for this section yet.
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </section>
            </div>

            {/* Right Side: Visual Chronological Timeline */}
            <section className="glass" style={{ padding: "28px", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                ⏳ Chronological Authorship Trail
              </h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Below is the tamper-proof ledger of student milestones recorded chronologically on our servers.
              </p>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                position: "relative",
                paddingLeft: "20px",
                borderLeft: "2px solid rgba(255,255,255,0.06)",
                marginTop: "10px",
                maxHeight: "750px",
                overflowY: "auto",
                paddingRight: "8px"
              }}>
                {report.timeline.map((log) => (
                  <div key={log.id} style={{ position: "relative" }}>
                    
                    {/* Timeline Node Icon Indicator */}
                    <div style={{
                      position: "absolute",
                      left: "-27px",
                      top: "2px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: getActionColor(log.action),
                      border: "3px solid var(--bg-main)",
                      boxShadow: `0 0 8px ${getActionColor(log.action)}`
                    }}></div>

                    <div className="paper-card" style={{
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px",
                      transition: "all 0.2s ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                        <span style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: getActionColor(log.action)
                        }}>
                          {getActionLabel(log.action)}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div>
                          Section Checkpoint: <strong style={{ color: "white", textTransform: "capitalize" }}>{log.section_key}</strong>
                        </div>
                        {log.action !== "audit_failure" && (
                          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                            <span>Size: <strong>{log.character_count} chars</strong></span>
                            <span>Plagiarism: <strong>{(log.plagiarism_index * 100).toFixed(1)}%</strong></span>
                            <span>Claims Syn: <strong>{log.synthesis_count}</strong></span>
                          </div>
                        )}
                        {log.action === "audit_failure" && (
                          <div style={{ color: "var(--accent-red)", fontStyle: "italic", fontSize: "0.75rem", marginTop: "4px" }}>
                            Pedagogical Gating active. Locked status maintained.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

      </main>

      {/* Global CSS Inject */}
      <style jsx global>{`
        .verify-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .verify-grid {
            grid-template-columns: 7fr 5fr;
          }
        }
        .glass {
          background: var(--bg-card);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-color);
          box-shadow: var(--shadow-lg);
          transition: border-color 0.3s ease;
        }
        .glass:hover {
          border-color: var(--border-color-hover);
        }
        .text-gradient {
          background: var(--grad-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: var(--border-color-hover);
          color: white;
        }
        .paper-card {
          background: rgba(255, 255, 255, 0.01);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
        .paper-card:hover {
          border-color: var(--border-color-hover);
          background: rgba(255, 255, 255, 0.02);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
}
