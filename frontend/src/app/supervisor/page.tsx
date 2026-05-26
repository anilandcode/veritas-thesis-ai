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
  
  const [supervisorEmail, setSupervisorEmail] = useState("advisor@veritas.ai");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [inspectorActiveTab, setInspectorActiveTab] = useState("context");
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [inviteDescription, setInviteDescription] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [comments, setComments] = useState<SupervisorComment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [selectedTextQuote, setSelectedTextQuote] = useState("");

  useEffect(() => {
    fetchCohortData();
  }, [supervisorEmail]);

  const fetchCohortData = async () => {
    setLoading(true);
    setError(null);
    try {
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
      
      await fetchCohortData();
      
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

  const filteredStudents = report?.students.filter(student => 
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.thesis_title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPlagiarismLabel = (score: number) => {
    if (score >= 0.60) return "High Overlap (Audit Flagged)";
    if (score >= 0.30) return "Moderate Overlap (Audited)";
    return "Low Overlap (Original)";
  };

  const getPlagiarismColor = (score: number) => {
    if (score >= 0.60) return "var(--danger)";
    if (score >= 0.30) return "var(--warning)";
    return "var(--success)";
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
            background: "var(--text-primary)",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--bg-card)" }}>V</span>
          </div>
          <div>
            <h1 style={{ fontSize: "1.4rem", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Veritas AI
            </h1>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
              B2B Institutional Cohorts Dashboard
            </span>
          </div>
        </div>

        {/* Identity Selector & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "6px 12px", borderRadius: "20px" }}>
            <span style={{ color: "var(--text-secondary)" }}>Advisor:</span>
            <select 
              value={supervisorEmail}
              onChange={(e) => setSupervisorEmail(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--text-primary)",
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
            className="btn btn-accent"
            style={{ fontSize: "13px" }}
          >
            + Invite Cohort Student
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "15px" }}>Loading Institutional Analytics Cohorts...</p>
        </div>
      ) : error ? (
        <div className="badge badge-evidence-gap" style={{ maxWidth: "800px", margin: "100px auto", padding: "24px", display: "block", borderRadius: "var(--radius-md)" }}>
          ⚠️ <strong>Access Restriction:</strong> {error}
        </div>
      ) : (
        <main style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "36px" }}>
          
          {/* Institutional Metrics Row */}
          <section className="dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            
            {/* Card 1: Cohort size */}
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "var(--accent-blue)", fontWeight: 700, letterSpacing: "0.05em" }}>
                Cohort Class Size
              </span>
              <strong style={{ display: "block", fontSize: "36px", fontWeight: 650, margin: "10px 0 4px 0" }}>
                {report?.students.length || 0}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Active graduate researchers</span>
            </div>

            {/* Card 2: Integrity averages */}
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "var(--success)", fontWeight: 700, letterSpacing: "0.05em" }}>
                Cohort Integrity Index
              </span>
              <strong style={{ display: "block", fontSize: "36px", fontWeight: 650, margin: "10px 0 4px 0" }}>
                {report?.average_integrity.toFixed(1)}%
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Original synthesized drafting average</span>
            </div>

            {/* Card 3: Dialog Velocity */}
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "var(--accent-blue)", fontWeight: 700, letterSpacing: "0.05em" }}>
                Socratic Steering Velocity
              </span>
              <strong style={{ display: "block", fontSize: "36px", fontWeight: 650, margin: "10px 0 4px 0" }}>
                {report?.total_interactions || 0}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total chat mentor interactions</span>
            </div>

            {/* Card 4: Milestones unlocked */}
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", color: "var(--warning)", fontWeight: 700, letterSpacing: "0.05em" }}>
                Gating Checkpoints Cleared
              </span>
              <strong style={{ display: "block", fontSize: "36px", fontWeight: 650, margin: "10px 0 4px 0" }}>
                {report?.unlocks_cleared || 0}
              </strong>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Section padlocks successfully cleared</span>
            </div>

          </section>

          {/* Student Cohort Directory Section */}
          <section className="panel" style={{ padding: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Cohort Directory</h2>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "2px" }}>Filter, search, and audit student drafts and plagiarism metrics.</p>
              </div>

              {/* Search Bar */}
              <input 
                type="text"
                placeholder="Search by student name, email, or thesis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-field"
                style={{
                  width: "360px",
                  maxWidth: "100%"
                }}
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>No active cohort students match your search criteria.</p>
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
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "12px",
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
                          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
                            {student.student_name}
                          </h3>
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            ID: {student.thesis_id}
                          </span>
                        </div>
                        <span style={{ fontSize: "12.5px", color: "var(--accent-blue)", display: "block", marginBottom: "8px" }}>
                          {student.student_email}
                        </span>
                        <h4 style={{ fontSize: "13.5px", color: "var(--text-secondary)", fontWeight: 500, lineHeight: "1.4", height: "38px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {student.thesis_title}
                        </h4>
                      </div>

                      {/* Outline Progress */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                          <span>Outline Progress:</span>
                          <strong>{locksCleared} / {totalSections} Lock Milestones</strong>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "var(--border-color)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{
                            width: `${totalSections > 0 ? (locksCleared / totalSections * 100) : 0}%`,
                            height: "100%",
                            background: "var(--accent-blue)",
                            borderRadius: "2px"
                          }}></div>
                        </div>
                      </div>

                      {/* Integrity alarm */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "12.5px" }}>
                        <div>
                          <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px" }}>Integrity Status</span>
                          <strong style={{ color: getPlagiarismColor(student.plagiarism_index), fontWeight: 600 }}>
                            {getPlagiarismLabel(student.plagiarism_index)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "11px" }}>Conversations</span>
                          <strong style={{ color: "var(--text-primary)" }}>{student.interaction_count} bubbles</strong>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => handleOpenInspector(student)}
                        className="btn btn-secondary"
                        style={{
                          width: "100%",
                          fontSize: "13px",
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
              borderLeft: "1px solid var(--border-color)",
              boxShadow: "-10px 0 40px rgba(16,24,40,0.06)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              animation: "slideIn 0.3s ease"
            }}>
              
              {/* Close and Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Student Authorship Inspector
                  </span>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
                    {selectedStudent.student_name}
                  </h3>
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{selectedStudent.student_email}</span>
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-tertiary)",
                    fontSize: "24px",
                    cursor: "pointer",
                    lineHeight: 1
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Topic */}
              <div className="panel-subtle" style={{ padding: "16px", marginBottom: "24px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", marginBottom: "6px", fontWeight: 600 }}>
                  Thesis Title
                </span>
                <p style={{ fontSize: "13px", color: "var(--text-primary)", lineHeight: "1.4", fontWeight: 600, marginBottom: "8px" }}>
                  {selectedStudent.thesis_title}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {selectedStudent.topic_description}
                </p>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", gap: "4px", marginBottom: "20px" }}>
                <button
                  onClick={() => setInspectorActiveTab("drafts")}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    color: inspectorActiveTab === "drafts" || !["timeline"].includes(inspectorActiveTab) ? "var(--accent-blue)" : "var(--text-tertiary)",
                    borderBottom: inspectorActiveTab === "drafts" || !["timeline"].includes(inspectorActiveTab) ? "2.5px solid var(--accent-blue)" : "2px solid transparent",
                    cursor: "pointer"
                  }}
                >
                  📝 View Outline Drafts
                </button>
                <button
                  onClick={() => setInspectorActiveTab("timeline")}
                  style={{
                    padding: "10px 16px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    color: inspectorActiveTab === "timeline" ? "var(--accent-blue)" : "var(--text-tertiary)",
                    borderBottom: inspectorActiveTab === "timeline" ? "2.5px solid var(--accent-blue)" : "2px solid transparent",
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingLeft: "16px", borderLeft: "2px solid var(--border-color)" }}>
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
                        
                        <div className="paper-card" style={{ padding: "12px 16px", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", marginBottom: "6px" }}>
                            <span style={{ fontWeight: 700, color: getActionColor(log.action) }}>
                              {getActionLabel(log.action)}
                            </span>
                            <span style={{ color: "var(--text-tertiary)" }}>
                              {new Date(log.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-primary)" }}>
                            Section Key: <span style={{ textTransform: "capitalize" }}>{log.section_key}</span>
                          </p>
                          {log.action !== "audit_failure" && (
                            <div style={{ display: "flex", gap: "12px", fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
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
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {selectedStudent.outline.map((item) => (
                        <button
                          key={item.section_key}
                          onClick={() => setInspectorActiveTab(item.section_key)}
                          style={{
                            padding: "6px 12px",
                            fontSize: "11.5px",
                            borderRadius: "12px",
                            border: `1.5px solid ${inspectorActiveTab === item.section_key || (!selectedStudent.outline.some(o => o.section_key === inspectorActiveTab) && item.section_key === "context") ? "var(--accent-blue)" : "var(--border-color)"}`,
                            cursor: "pointer",
                            background: inspectorActiveTab === item.section_key || (!selectedStudent.outline.some(o => o.section_key === inspectorActiveTab) && item.section_key === "context") ? "var(--bg-blue-soft)" : "transparent",
                            color: inspectorActiveTab === item.section_key || (!selectedStudent.outline.some(o => o.section_key === inspectorActiveTab) && item.section_key === "context") ? "var(--accent-blue)" : "var(--text-secondary)",
                            fontWeight: 500
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
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <span>Status: <strong>{item.status}</strong></span>
                            <span>Draft Size: <strong>{item.draft_text.length} chars</strong></span>
                          </div>
                          
                          <div style={{
                            background: "var(--bg-subtle)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "8px",
                            padding: "16px",
                            fontSize: "13.5px",
                            lineHeight: "1.65",
                            color: "var(--text-secondary)",
                            whiteSpace: "pre-wrap",
                            maxHeight: "350px",
                            overflowY: "auto"
                          }}>
                            {item.draft_text || (
                              <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                No draft text content saved for this outline checkpoint yet.
                              </span>
                            )}
                          </div>

                          {/* Socratic supervisor comments for this active section */}
                          <div style={{ marginTop: "24px", borderTop: "1px solid var(--border-color)", paddingTop: "20px" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                              💬 Socratic Feedback Annotations ({comments.filter(c => c.section_key === item.section_key).length})
                            </h4>
                            
                            {/* Comments list */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                              {comments.filter(c => c.section_key === item.section_key).length === 0 ? (
                                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>
                                  No supervisor comments dropped on this outline checkpoint yet.
                                </p>
                              ) : (
                                comments.filter(c => c.section_key === item.section_key).map((comment) => (
                                  <div 
                                    key={comment.id}
                                    style={{
                                      background: comment.is_resolved ? "var(--bg-subtle)" : "var(--bg-card)",
                                      border: `1px solid ${comment.is_resolved ? "rgba(6, 118, 71, 0.15)" : "rgba(37, 99, 235, 0.15)"}`,
                                      borderRadius: "8px",
                                      padding: "12px 14px",
                                      fontSize: "13px",
                                      lineHeight: "1.4"
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                      <span style={{ fontSize: "11px", fontWeight: 700, color: comment.is_resolved ? "var(--success)" : "var(--accent-blue)", textTransform: "uppercase" }}>
                                        {comment.is_resolved ? "✓ Resolved Socratic Steer" : "● Active Socratic Feedback"}
                                      </span>
                                      <span style={{ fontSize: "10.5px", color: "var(--text-tertiary)" }}>
                                        {new Date(comment.created_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {comment.highlighted_quote && (
                                      <blockquote style={{ fontSize: "12px", fontStyle: "italic", borderLeft: "2px solid var(--border-color)", paddingLeft: "10px", margin: "0 0 8px 0", color: "var(--text-secondary)" }}>
                                        "{comment.highlighted_quote}"
                                      </blockquote>
                                    )}
                                    <p style={{ color: "var(--text-primary)", margin: 0 }}>{comment.comment_text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add comment form */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg-subtle)", border: "1px solid var(--border-color)", padding: "14px", borderRadius: "8px" }}>
                              <span style={{ fontSize: "11.5px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>
                                Drop Socratic Feedback Comment
                              </span>
                              
                              <input 
                                type="text"
                                placeholder="Highlighted text quote reference (optional)..."
                                value={selectedTextQuote}
                                onChange={(e) => setSelectedTextQuote(e.target.value)}
                                className="text-field"
                                style={{ height: "36px", fontSize: "12.5px" }}
                              />
                              
                              <textarea 
                                placeholder="Write your Socratic coaching comments here..."
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                className="text-area"
                                style={{ minHeight: "80px", fontSize: "12.5px" }}
                              />
                              
                              <button 
                                onClick={handlePostComment}
                                className="btn btn-primary"
                                style={{ alignSelf: "flex-end", height: "32px", fontSize: "12px" }}
                              >
                                Drop Socratic Annotation
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

          {/* Sliding Invite Form Drawer */}
          {isInviteOpen && (
            <div style={{
              position: "fixed",
              top: 0,
              right: 0,
              width: "480px",
              maxWidth: "100%",
              height: "100vh",
              background: "var(--bg-card)",
              borderLeft: "1px solid var(--border-color)",
              boxShadow: "-10px 0 40px rgba(16,24,40,0.06)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
              padding: "32px",
              animation: "slideIn 0.3s ease"
            }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Invite Cohort Student</h3>
                <button onClick={() => setIsInviteOpen(false)} style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: "24px", cursor: "pointer" }}>&times;</button>
              </div>

              {inviteSuccess && (
                <div className="badge badge-source-linked" style={{ width: "100%", padding: "10px 12px", display: "block", marginBottom: "16px", borderRadius: "6px" }}>
                  ✓ Student Invited successfully! Literature mapping process initialized.
                </div>
              )}

              <form onSubmit={handleInviteStudent} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="inv-email">Student Academic Email</label>
                  <input 
                    id="inv-email"
                    type="email"
                    placeholder="student@university.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="text-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="inv-title">Proposed Thesis Title</label>
                  <input 
                    id="inv-title"
                    type="text"
                    placeholder="e.g. Socratic Steerability in routing networks"
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    className="text-field"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="inv-desc">Research Context Hypothesis</label>
                  <textarea 
                    id="inv-desc"
                    placeholder="Describe the research objectives..."
                    value={inviteDescription}
                    onChange={(e) => setInviteDescription(e.target.value)}
                    className="text-area"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={inviteLoading}
                  className="btn btn-accent"
                  style={{ width: "100%", height: "44px", marginTop: "12px" }}
                >
                  {inviteLoading ? "Inviting student..." : "Send Invitation"}
                </button>
              </form>

            </div>
          )}

        </main>
      )}

      {/* Global CSS Inject */}
      <style jsx global>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 24px;
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
