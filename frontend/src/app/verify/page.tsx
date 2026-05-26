"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
        return "var(--success)";
      case "audit_failure":
        return "var(--danger)";
      default:
        return "var(--accent-blue)";
    }
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "var(--bg-main)",
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
            background: "var(--text-primary)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--bg-card)" }}>V</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Veritas AI
            </h1>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
              B2B Authorship Verification Portal
            </span>
          </div>
        </div>
        <Link 
          href="/app"
          className="btn btn-secondary"
          style={{ textDecoration: "none", fontSize: "13px" }}
        >
          Return to Workspace
        </Link>
      </header>

      {/* Main Core Layout Grid */}
      <main style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Search Drawer Panel */}
        <section className="panel" style={{ padding: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
            Verify Academic Authorship
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
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
              className="text-field"
              style={{
                flex: 1,
                minWidth: "280px",
                fontFamily: "monospace"
              }}
            />
            <button
              onClick={() => handleVerifySignature()}
              disabled={loading}
              className="btn btn-primary"
              style={{
                padding: "0 28px",
                fontSize: "14px"
              }}
            >
              {loading ? "Locating Certificate..." : "Verify Progress Certificate"}
            </button>
          </div>

          {error && (
            <div className="badge badge-evidence-gap" style={{
              marginTop: "20px",
              padding: "14px 18px",
              width: "100%",
              display: "block",
              borderRadius: "var(--radius-md)",
              fontSize: "13px"
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
              <section className="panel" style={{ padding: "28px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-blue)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Identity Audited Successfully
                    </span>
                    <h3 style={{ fontSize: "22px", fontWeight: 600, margin: "4px 0 8px 0" }}>
                      {report.thesis_title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>
                      Student Email: <strong style={{ color: "var(--text-primary)" }}>{report.student_email}</strong>
                    </p>
                  </div>
                  <div className="badge badge-source-linked" style={{ fontSize: "12px", padding: "6px 16px" }}>
                    <span style={{ width: "8px", height: "8px", background: "var(--success)", borderRadius: "50%", display: "inline-block", animation: "pulse-glow 1.5s infinite" }}></span>
                    Authorship Authenticated
                  </div>
                </div>

                <div className="panel-subtle" style={{ marginBottom: "20px", padding: "16px" }}>
                  <strong style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                    Research Topic & Concept
                  </strong>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                    {report.topic_description}
                  </p>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "24px", fontSize: "12px", color: "var(--text-secondary)" }}>
                  <div>
                    Certificate Key: <code style={{ color: "var(--accent-blue)", fontFamily: "monospace" }}>{report.verification_sig.split("-")[3] || "N/A"}</code>
                  </div>
                  <div>
                    Synthesized Facts: <strong style={{ color: "var(--text-primary)" }}>{report.timeline.filter(t => t.action === "unlock_section").length} Locked Gates Cleared</strong>
                  </div>
                </div>
              </section>

              {/* Tabbed Interactive Section Draft Inspector */}
              <section className="panel" style={{ padding: "28px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
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
                        fontSize: "13px",
                        fontWeight: 600,
                        background: "transparent",
                        border: "none",
                        color: activeTab === item.section_key ? "var(--accent-blue)" : "var(--text-tertiary)",
                        borderBottom: activeTab === item.section_key ? "2.5px solid var(--accent-blue)" : "2px solid transparent",
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

                  const logs = report.timeline.filter(t => t.section_key === item.section_key);
                  const latestLog = logs[logs.length - 1];

                  return (
                    <div key={item.section_key} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                        <div style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Section Status</span>
                          <strong style={{ display: "block", fontSize: "14px", color: item.status === "Completed" ? "var(--success)" : "var(--warning)", marginTop: "4px" }}>
                            {item.status}
                          </strong>
                        </div>
                        <div style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Draft Length</span>
                          <strong style={{ display: "block", fontSize: "14px", color: "var(--text-primary)", marginTop: "4px" }}>
                            {item.draft_text.length} characters
                          </strong>
                        </div>
                        <div style={{ background: "var(--bg-subtle)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Local Plagiarism Risk</span>
                          <strong style={{ display: "block", fontSize: "14px", color: (latestLog?.plagiarism_index || 0) >= 0.30 ? "var(--warning)" : "var(--success)", marginTop: "4px" }}>
                            {((latestLog?.plagiarism_index || 0) * 100).toFixed(1)}% ({latestLog?.plagiarism_index >= 0.30 ? "Moderate" : "Low"})
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <strong style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-tertiary)" }}>
                          Draft Text Content
                        </strong>
                        <div style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "8px",
                          padding: "20px",
                          fontSize: "14px",
                          lineHeight: "1.65",
                          color: "var(--text-secondary)",
                          whiteSpace: "pre-wrap",
                          maxHeight: "350px",
                          overflowY: "auto"
                        }}>
                          {item.draft_text || (
                            <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
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
            <section className="panel" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                ⏳ Chronological Authorship Trail
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Below is the tamper-proof ledger of student milestones recorded chronologically on our servers.
              </p>

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                position: "relative",
                paddingLeft: "20px",
                borderLeft: "2px solid var(--border-color)",
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
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: getActionColor(log.action),
                      border: "3px solid var(--bg-main)",
                      boxShadow: `0 0 8px ${getActionColor(log.action)}`
                    }}></div>

                    <div className="paper-card" style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "8px",
                      padding: "16px",
                      transition: "all 0.2s ease"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: getActionColor(log.action)
                        }}>
                          {getActionLabel(log.action)}
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div>
                          Section Checkpoint: <strong style={{ color: "var(--text-primary)", textTransform: "capitalize" }}>{log.section_key}</strong>
                        </div>
                        {log.action !== "audit_failure" && (
                          <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                            <span>Size: <strong>{log.character_count} chars</strong></span>
                            <span>Plagiarism: <strong>{(log.plagiarism_index * 100).toFixed(1)}%</strong></span>
                            <span>Claims Syn: <strong>{log.synthesis_count}</strong></span>
                          </div>
                        )}
                        {log.action === "audit_failure" && (
                          <div style={{ color: "var(--danger)", fontStyle: "italic", fontSize: "11px", marginTop: "4px" }}>
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
        .text-gradient {
          color: var(--accent-blue);
        }
      `}</style>
    </div>
  );
}
