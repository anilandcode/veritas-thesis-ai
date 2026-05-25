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

interface StudentSummary {
  thesis_id: number;
  student_email: string;
  student_name: string;
  thesis_title: string;
  topic_description: string;
  current_section: string;
  status: string;
  plagiarism_index: number;
  synthesis_percentage: number;
  interaction_count: number;
  verification_sig: string;
  outline: OutlineItem[];
  timeline: TimelineLog[];
}

interface CohortReport {
  students: StudentSummary[];
  average_integrity: number;
  total_interactions: number;
  unlocks_cleared: number;
}

interface SupervisorComment {
  id: number;
  thesis_id: number;
  section_key: string;
  highlighted_quote?: string | null;
  comment_text: string;
  is_resolved: boolean;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function SupervisorDashboardPortal() {
  const [report, setReport] = useState<CohortReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Supervisor Identity (Mock authenticated user email in development)
  const [supervisorEmail, setSupervisorEmail] = useState("advisor@veritas.ai");
  
  // Search / Filter Cohort students
  const [searchTerm, setSearchTerm] = useState("");
  
  // Inspect Student side-over drawer state
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [inspectorActiveTab, setInspectorActiveTab] = useState("context");
  
  // Invite Student sliding form drawer state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteDescription, setInviteDescription] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Supervisor Comments states
  const [comments, setComments] = useState<SupervisorComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedTextQuote, setSelectedTextQuote] = useState("");

  // Fetch Supervisor Cohort on load or email change
  useEffect(() => {
    fetchCohortData();
  }, [supervisorEmail]);

  const fetchCohortData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Dev auth mock matching 'mock_user_email' parsed on backend
      const mockToken = `mock_user_${supervisorEmail.split("@")[0]}`;
      const res = await fetch(`${BACKEND_URL}/thesis/supervisor/students`, {
        headers: {
          "Authorization": `Bearer ${mockToken}`
        }
      });

      if (!res.ok) {
        throw new Error("Failed to load supervisor cohort data. Please check access permissions.");
      }

      const data: CohortReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteTitle.trim() || !inviteDescription.trim()) return;

    setInviteLoading(true);
    setInviteSuccess(false);
    setError(null);

    try {
      const mockToken = `mock_user_${supervisorEmail.split("@")[0]}`;
      const res = await fetch(`${BACKEND_URL}/thesis/supervisor/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          student_email: inviteEmail.trim(),
          thesis_title: inviteTitle.trim(),
          topic_description: inviteDescription.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to invite cohort student.");
      }

      setInviteSuccess(true);
      setInviteEmail("");
      setInviteTitle("");
      setInviteDescription("");
      
      // Refresh cohort directories
      await fetchCohortData();
      
      // Close drawer after short delay
      setTimeout(() => {
        setIsInviteOpen(false);
        setInviteSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Invitation failed.");
    } finally {
      setInviteLoading(false);
    }
  };

  const fetchComments = async (thesisId: number) => {
    try {
      const mockToken = `mock_user_${supervisorEmail.split("@")[0]}`;
      const res = await fetch(`${BACKEND_URL}/thesis/${thesisId}/comments`, {
        headers: {
          "Authorization": `Bearer ${mockToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch supervisor comments", err);
    }
  };

  const handlePostComment = async () => {
    if (!selectedStudent || !newCommentText.trim()) return;
    try {
      const mockToken = `mock_user_${supervisorEmail.split("@")[0]}`;
      const res = await fetch(`${BACKEND_URL}/thesis/${selectedStudent.thesis_id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${mockToken}`
        },
        body: JSON.stringify({
          section_key: inspectorActiveTab,
          highlighted_quote: selectedTextQuote.trim() || null,
          comment_text: newCommentText.trim()
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => [...prev, newComment]);
        setNewCommentText("");
        setSelectedTextQuote("");
        
        // Refresh cohort data
        await fetchCohortData();
      } else {
        alert("Failed to submit supervisor Socratic comment.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenInspector = (student: StudentSummary) => {
    setSelectedStudent(student);
    if (student.outline.length > 0) {
      setInspectorActiveTab(student.outline[0].section_key);
    }
    fetchComments(student.thesis_id);
  };

  // Filter students based on search queries
  const filteredStudents = report?.students.filter(student => 
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.thesis_title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPlagiarismLabel = (score: number) => {
    if (score >= 0.60) return "Verbatim Paste Flag (Critical)";
    if (score >= 0.30) return "Moderate Overlap (Audited)";
    return "Low Overlap (Original)";
  };

  const getPlagiarismColor = (score: number) => {
    if (score >= 0.60) return "var(--accent-red)";
    if (score >= 0.30) return "var(--accent-amber)";
    return "var(--accent-green)";
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "save_draft":
        return "Saved Draft Checkpoint";
      case "unlock_section":
        return "Socratic Verification Approved (Section Unlocked)";
      case "audit_failure":
        return "Steering Audit Gating: Locked Maintained";
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
      
      {/* Visual B2B Cohort Header */}
      <header style={{
        maxWidth: "1400px",
        margin: "0 auto 36px auto",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            background: "var(--grad-primary)",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "var(--shadow-glow)"
          }}>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "white" }}>V</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              VERITAS <span className="text-gradient">AI</span>
            </h1>
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              B2B Institutional Cohorts Dashboard
            </span>
          </div>
        </div>

        {/* Identity Selector & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", padding: "6px 12px", borderRadius: "20px" }}>
            <span style={{ color: "var(--text-muted)" }}>Advisor:</span>
            <select 
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="advisor@veritas.ai">Dr. Jane Advisor</option>
              <option value="director@veritas.ai">Dept Director</option>
            </select>
          </div>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="btn btn-primary"
            style={{
              padding: "10px 20px",
              fontSize: "0.82rem",
              fontWeight: 600,
              background: "var(--grad-primary)",
              border: "none",
              borderRadius: "var(--radius-sm)",
              boxShadow: "var(--shadow-glow)",
              cursor: "pointer"
            }}
          >
            + Invite Cohort Student
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading Institutional Analytics Cohorts...</p>
        </div>
      ) : error ? (
        <div className="glass" style={{ maxWidth: "800px", margin: "100px auto", padding: "24px", borderRadius: "var(--radius-md)", borderLeft: "4px solid var(--accent-red)" }}>
          ⚠️ <strong>Access Restriction:</strong> {error}
        </div>
      ) : (
        <main style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "36px" }}>
          
          {/* Institutional Metrics Row */}
          <section className="dashboard-grid">
            
            {/* Card 1: Cohort size */}
            <div className="glass metric-card" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
              <span className="metric-label" style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-cyan)", fontWeight: 700 }}>
                Cohort Class Size
              </span>
              <strong style={{ display: "block", fontSize: "2.2rem", fontWeight: 800, margin: "10px 0 4px 0", color: "white" }}>
                {report?.students.length || 0}
              </strong>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Active graduate researchers</span>
            </div>

            {/* Card 2: Integrity averages */}
            <div className="glass metric-card" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
              <span className="metric-label" style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-green)", fontWeight: 700 }}>
                Cohort Integrity Index
              </span>
              <strong style={{ display: "block", fontSize: "2.2rem", fontWeight: 800, margin: "10px 0 4px 0", color: "white" }}>
                {report?.average_integrity.toFixed(1)}%
              </strong>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Original synthesized drafting average</span>
            </div>

            {/* Card 3: Dialog Velocity */}
            <div className="glass metric-card" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
              <span className="metric-label" style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-violet)", fontWeight: 700 }}>
                Socratic Steering Velocity
              </span>
              <strong style={{ display: "block", fontSize: "2.2rem", fontWeight: 800, margin: "10px 0 4px 0", color: "white" }}>
                {report?.total_interactions || 0}
              </strong>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Total chat mentor interactions</span>
            </div>

            {/* Card 4: Milestones unlocked */}
            <div className="glass metric-card" style={{ padding: "24px", borderRadius: "var(--radius-lg)" }}>
              <span className="metric-label" style={{ display: "block", fontSize: "0.72rem", textTransform: "uppercase", color: "var(--accent-amber)", fontWeight: 700 }}>
                Gating Checkpoints Cleared
              </span>
              <strong style={{ display: "block", fontSize: "2.2rem", fontWeight: 800, margin: "10px 0 4px 0", color: "white" }}>
                {report?.unlocks_cleared || 0}
              </strong>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Section padlocks successfully cleared</span>
            </div>

          </section>

          {/* Student Cohort Directory Section */}
          <section className="glass" style={{ padding: "32px", borderRadius: "var(--radius-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "white" }}>Cohort Directory</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Filter, search, and audit student drafts and plagiarism metrics.</p>
              </div>

              {/* Search Bar */}
              <input 
                type="text"
                placeholder="Search by student name, email, or thesis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "360px",
                  maxWidth: "100%",
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 14px",
                  color: "white",
                  fontSize: "0.82rem",
                  outline: "none"
                }}
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>No active cohort students match your search criteria.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                {filteredStudents.map((student) => {
                  const locksCleared = student.outline.filter(item => item.status === "Completed").length;
                  const totalSections = student.outline.length;

                  return (
                    <div 
                      key={student.thesis_id}
                      className="paper-card"
                      style={{
                        background: "rgba(255,255,255,0.01)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-lg)",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        transition: "all 0.25s ease"
                      }}
                    >
                      {/* Card Header info */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "white" }}>
                            {student.student_name}
                          </h3>
                          <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                            ID: {student.thesis_id}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", display: "block", marginBottom: "8px" }}>
                          {student.student_email}
                        </span>
                        <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, lineHeight: "1.4", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {student.thesis_title}
                        </h4>
                      </div>

                      {/* locked Outline Progress */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "6px" }}>
                          <span>Outline Progress:</span>
                          <strong>{locksCleared} / {totalSections} Lock Milestones</strong>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{
                            width: `${totalSections > 0 ? (locksCleared / totalSections * 100) : 0}%`,
                            height: "100%",
                            background: "var(--grad-primary)",
                            borderRadius: "2px"
                          }}></div>
                        </div>
                      </div>

                      {/* Integrity alarm */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "0.78rem" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.68rem" }}>Integrity Status</span>
                          <strong style={{ color: getPlagiarismColor(student.plagiarism_index) }}>
                            {getPlagiarismLabel(student.plagiarism_index)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.68rem" }}>Conversations</span>
                          <strong style={{ color: "white" }}>{student.interaction_count} bubbles</strong>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleOpenInspector(student)}
                        className="btn btn-secondary"
                        style={{
                          width: "100%",
                          padding: "10px",
                          fontSize: "0.8rem",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border-color)",
                          cursor: "pointer",
                          marginTop: "8px"
                        }}
                      >
                        🔎 Inspect Student Authorship
                      </button>

                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Side-Drawer Student Inspector */}
          {selectedStudent && (
            <div style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "680px",
              maxWidth: "100%",
              height: "100vh",
              background: "var(--bg-card)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderLeft: "1px solid var(--border-color)",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              animation: "slideIn 0.3s ease"
            }}>
              
              {/* Close and Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", fontWeight: 700, textTransform: "uppercase" }}>
                    Student Authorship Inspector
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", marginTop: "4px" }}>
                    {selectedStudent.student_name}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{selectedStudent.student_email}</span>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.5rem",
                    cursor: "pointer"
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Topic */}
              <div style={{
                background: "rgba(0,0,0,0.2)",
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-color)",
                marginBottom: "24px"
              }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                  Thesis Title
                </span>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4", fontWeight: 600, marginBottom: "8px" }}>
                  {selectedStudent.thesis_title}
                </p>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                  {selectedStudent.topic_description}
                </p>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "4px", marginBottom: "20px" }}>
                <button
                  onClick={() => setInspectorActiveTab("drafts")}
                  style={{
                    padding: "10px 16px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    color: inspectorActiveTab === "drafts" || !["timeline"].includes(inspectorActiveTab) ? "var(--accent-cyan)" : "var(--text-muted)",
                    borderBottom: inspectorActiveTab === "drafts" || !["timeline"].includes(inspectorActiveTab) ? "2.5px solid var(--accent-cyan)" : "2px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  📝 View Outline Drafts
                </button>
                <button
                  onClick={() => setInspectorActiveTab("timeline")}
                  style={{
                    padding: "10px 16px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    color: inspectorActiveTab === "timeline" ? "var(--accent-cyan)" : "var(--text-muted)",
                    borderBottom: inspectorActiveTab === "timeline" ? "2.5px solid var(--accent-cyan)" : "2px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  ⏳ Chronological Log Trail
                </button>
              </div>

              {/* Scrollable Inspectors Area */}
              <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
                {inspectorActiveTab === "timeline" ? (
                  
                  /* Timeline Log inspect */
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingLeft: "16px", borderLeft: "2px solid rgba(255,255,255,0.06)" }}>
                    {selectedStudent.timeline.map((log) => (
                      <div key={log.id} style={{ position: "relative" }}>
                        <div style={{
                          position: "absolute",
                          left: "-23px",
                          top: "4px",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: getActionColor(log.action),
                          boxShadow: `0 0 6px ${getActionColor(log.action)}`
                        }}></div>
                        
                        <div className="paper-card" style={{ padding: "12px 16px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 700, color: getActionColor(log.action) }}>
                              {getActionLabel(log.action)}
                            </span>
                            <span style={{ color: "var(--text-muted)" }}>
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: "0.78rem", color: "white" }}>
                            Section Key: <span style={{ textTransform: "capitalize" }}>{log.section_key}</span>
                          </p>
                          {log.action !== "audit_failure" && (
                            <div style={{ display: "flex", gap: "12px", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                              <span>Size: {log.character_count} chars</span>
                              <span>Similarity: {(log.plagiarism_index * 100).toFixed(1)}%</span>
                              <span>Keywords Syn: {log.synthesis_count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                ) : (

                  /* Tabbed Draft inspect */
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    
                    {/* Outline Select */}
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      {selectedStudent.outline.map((item) => (
                        <button
                          key={item.section_key}
                          onClick={() => setInspectorActiveTab(item.section_key)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "0.72rem",
                            borderRadius: "12px",
                            border: "1px solid var(--border-color)",
                            cursor: "pointer",
                            background: inspectorActiveTab === item.section_key || (!selectedStudent.outline.some(o => o.section_key === inspectorActiveTab) && item.section_key === "context") ? "var(--grad-primary)" : "transparent",
                            color: "white"
                          }}
                        >
                          {item.section_title} ({item.status})
                        </button>
                      ))}
                    </div>

                    {selectedStudent.outline.map((item) => {
                      const isActive = inspectorActiveTab === item.section_key || (!selectedStudent.outline.some(o => o.section_key === inspectorActiveTab) && item.section_key === "context");
                      if (!isActive) return null;

                      return (
                        <div key={item.section_key} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            <span>Status: <strong>{item.status}</strong></span>
                            <span>Draft Size: <strong>{item.draft_text.length} chars</strong></span>
                          </div>
                          
                          <div style={{
                            background: "rgba(0,0,0,0.25)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                            fontSize: "0.82rem",
                            lineHeight: "1.6",
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            maxHeight: "350px",
                            overflowY: "auto"
                          }}>
                            {item.draft_text || (
                              <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                                No draft text content saved for this outline checkpoint yet.
                              </span>
                            )}
                          </div>

                          {/* Socratic supervisor comments for this active section */}
                          <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                            <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "white", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                              💬 Socratic Feedback Annotations ({comments.filter(c => c.section_key === item.section_key).length})
                            </h4>
                            
                            {/* Comments list */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                              {comments.filter(c => c.section_key === item.section_key).length === 0 ? (
                                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                  No supervisor comments dropped on this outline checkpoint yet.
                                </p>
                              ) : (
                                comments.filter(c => c.section_key === item.section_key).map((comment) => (
                                  <div 
                                    key={comment.id}
                                    style={{
                                      background: comment.is_resolved ? "rgba(16,185,129,0.03)" : "rgba(10,200,255,0.03)",
                                      border: `1px solid ${comment.is_resolved ? "rgba(16,185,129,0.15)" : "rgba(10,200,255,0.15)"}`,
                                      borderRadius: "var(--radius-md)",
                                      padding: "12px 14px",
                                      fontSize: "0.8rem",
                                      lineHeight: "1.4"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                      <span style={{ fontSize: "0.68rem", fontWeight: 700, color: comment.is_resolved ? "var(--accent-green)" : "var(--accent-cyan)", textTransform: "uppercase" }}>
                                        {comment.is_resolved ? "✓ Resolved Socratic Steer" : "● Active Socratic Feedback"}
                                      </span>
                                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {comment.highlighted_quote && (
                                      <blockquote style={{ fontSize: "0.74rem", fontStyle: "italic", borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                                        "{comment.highlighted_quote}"
                                      </blockquote>
                                    )}
                                    <p style={{ color: "var(--text-primary)", margin: 0 }}>{comment.comment_text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add comment form */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "var(--radius-md)" }}>
                              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                Drop Socratic Feedback Comment
                              </span>
                              
                              <input 
                                type="text"
                                placeholder="Highlighted text quote reference (optional)..."
                                value={selectedTextQuote}
                                onChange={(e) => setSelectedTextQuote(e.target.value)}
                                style={{
                                  background: "var(--bg-input)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "8px 12px",
                                  color: "white",
                                  fontSize: "0.78rem",
                                  outline: "none"
                                }}
                              />
                              
                              <textarea 
                                placeholder="Type your Socratic guidance comment here. Ask critical questions to steer student original literature synthesis..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                rows={3}
                                style={{
                                  background: "var(--bg-input)",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "var(--radius-sm)",
                                  padding: "8px 12px",
                                  color: "white",
                                  fontSize: "0.78rem",
                                  outline: "none",
                                  resize: "vertical",
                                  fontFamily: "inherit"
                                }}
                              />
                              
                              <button
                                onClick={handlePostComment}
                                className="btn btn-primary"
                                style={{
                                  padding: "8px 16px",
                                  fontSize: "0.78rem",
                                  alignSelf: "flex-end",
                                  background: "var(--grad-primary)",
                                  border: "none",
                                  borderRadius: "var(--radius-sm)",
                                  color: "white",
                                  cursor: "pointer",
                                  fontWeight: 600
                                }}
                              >
                                Post Socratic Annotation
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  </div>

                )}
              </div>

            </div>
          )}

          {/* Sliding invite student drawer */}
          {isInviteOpen && (
            <div style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "500px",
              maxWidth: "100%",
              height: "100vh",
              background: "var(--bg-card)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderLeft: "1px solid var(--border-color)",
              boxShadow: "-10px 0 40px rgba(0,0,0,0.6)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              animation: "slideIn 0.3s ease"
            }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--accent-cyan)", fontWeight: 700, textTransform: "uppercase" }}>
                    B2B SaaS Portal
                  </span>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "white", marginTop: "4px" }}>
                    Invite Cohort Student
                  </h3>
                </div>
                <button
                  onClick={() => setIsInviteOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.5rem",
                    cursor: "pointer"
                  }}
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleInviteStudent} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Student Email Address
                  </label>
                  <input 
                    type="email"
                    required
                    placeholder="student@university.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      color: "white",
                      fontSize: "0.82rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Thesis Document Title
                  </label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Socratic Steering protocols inside educational systems"
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      color: "white",
                      fontSize: "0.82rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Topic Description & Scope
                  </label>
                  <textarea 
                    required
                    rows={4}
                    placeholder="Describe what background research areas, literature findings, and objectives student outline checkpoints will target..."
                    value={inviteDescription}
                    onChange={(e) => setInviteDescription(e.target.value)}
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "var(--radius-sm)",
                      padding: "10px 14px",
                      color: "white",
                      fontSize: "0.82rem",
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                {inviteSuccess && (
                  <div className="glass" style={{ padding: "12px", borderRadius: "var(--radius-sm)", borderLeft: "4px solid var(--accent-green)", background: "rgba(16,185,129,0.05)", color: "white", fontSize: "0.8rem" }}>
                    ✓ Cohort student invited successfully! Research swarm initiated.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={inviteLoading}
                  className="btn btn-primary"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    background: "var(--grad-primary)",
                    border: "none",
                    boxShadow: "var(--shadow-glow)",
                    borderRadius: "var(--radius-sm)",
                    color: "white",
                    cursor: "pointer",
                    opacity: inviteLoading ? 0.7 : 1,
                    marginTop: "12px"
                  }}
                >
                  {inviteLoading ? "Initiating Research Swarms..." : "Send Cohort Invitation"}
                </button>

              </form>

            </div>
          )}

        </main>
      )}

      {/* Global Style Injections */}
      <style jsx global>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
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
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
      `}</style>

    </div>
  );
}
