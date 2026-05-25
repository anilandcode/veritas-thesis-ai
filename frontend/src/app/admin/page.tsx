"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface DepartmentAnalytics {
  active_students_count: number;
  average_originality_index: number;
  average_socratic_dialogs: number;
  unlocked_milestones_ratio: number;
  active_advisor_licenses_count: number;
  total_theses: number;
}

interface StudentCohortDetail {
  id: number;
  student_name: string;
  student_email: string;
  thesis_title: string;
  originality_score: number;
  socratic_dialogs_count: number;
  saves_count: number;
  unlocked_checkpoints_count: number;
  status: string;
  administrative_hold: boolean;
  thesis_id: number;
}

interface AdvisorLicenseDetail {
  id: number;
  full_name: string;
  email: string;
  is_supervisor: boolean;
  created_at: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function DeanPortal() {
  const { isAuthenticated, user, login, logout, getAuthHeaders, isLoading: authLoading } = useAuth();
  
  // Login input values
  const [emailInput, setEmailInput] = useState("dean@veritas.ai");
  const [authError, setAuthError] = useState<string | null>(null);

  // Dean Analytics state
  const [analytics, setAnalytics] = useState<DepartmentAnalytics | null>(null);
  const [cohort, setCohort] = useState<StudentCohortDetail[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorLicenseDetail[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<"cohort" | "advisors">("cohort");
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Auto-fetch data if authenticated as Dean
  useEffect(() => {
    if (isAuthenticated && user?.is_dean) {
      fetchDeanData();
    }
  }, [isAuthenticated, user]);

  const fetchDeanData = async () => {
    setIsLoadingData(true);
    setFetchError(null);
    try {
      const headers = getAuthHeaders();
      
      // 1. Fetch Departmental Analytics
      const analyticsRes = await fetch(`${BACKEND_URL}/admin/analytics`, { headers });
      if (!analyticsRes.ok) throw new Error("Failed to load departmental analytics aggregates.");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // 2. Fetch Cohort Students List
      // We leverage the existing cohort report endpoint as Dean is supervisor-equivalent
      const cohortRes = await fetch(`${BACKEND_URL}/thesis/supervisor/students`, { headers });
      if (cohortRes.ok) {
        const cohortData = await cohortRes.json();
        // Map cohort reporting structures into detail schema
        const mappedCohort = cohortData.reports.map((r: any, idx: number) => ({
          id: r.thesis_id || idx + 1,
          student_name: r.student_name,
          student_email: r.student_email,
          thesis_title: r.thesis_title,
          originality_score: r.originality_score || 95.0,
          socratic_dialogs_count: r.socratic_dialogs_count || 12,
          saves_count: r.saves_count || 8,
          unlocked_checkpoints_count: r.unlocked_checkpoints_count || 2,
          status: r.status || "Drafting",
          administrative_hold: r.administrative_hold || false,
          thesis_id: r.thesis_id
        }));
        setCohort(mappedCohort);
      }

      // 3. Populate simulated advisors list for licensing approvals demonstration
      const dummyAdvisors: AdvisorLicenseDetail[] = [
        {
          id: 201,
          full_name: "Dr. Jane Advisor",
          email: "advisor@veritas.ai",
          is_supervisor: true,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 202,
          full_name: "Dr. Richard Feynman",
          email: "feynman@veritas.ai",
          is_supervisor: false,
          created_at: new Date().toISOString()
        },
        {
          id: 203,
          full_name: "Prof. Marie Curie",
          email: "curie@veritas.ai",
          is_supervisor: false,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      setAdvisors(dummyAdvisors);

    } catch (err: any) {
      console.error(err);
      setFetchError(err.message || "Failed to retrieve university enterprise statistics.");
    } finally {
      setIsLoadingData(false);
    }
  };

  // Trigger dean mock token auth
  const handleDeanLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    // We append _dean to the email prefix to trigger is_dean = True auto-provisioning
    const prefix = emailInput.split("@")[0];
    const mockToken = `mock_user_dean_${prefix}`;
    
    try {
      await login(emailInput, mockToken);
    } catch (err: any) {
      setAuthError(err.message || "B2B Authentication bypass failed.");
    }
  };

  // Toggle administrative holds
  const handleToggleHold = async (thesisId: number, currentHold: boolean) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/theses/${thesisId}/hold`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ administrative_hold: !currentHold })
      });
      
      if (res.ok) {
        setCohort(prev => prev.map(c => c.thesis_id === thesisId ? { ...c, administrative_hold: !currentHold } : c));
        // Refresh analytics
        await fetchDeanData();
      } else {
        alert("Failed to update administrative hold status.");
      }
    } catch (err) {
      console.error("Hold toggle failed", err);
    }
  };

  // Approve supervisor licensing
  const handleApproveSupervisor = async (userId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/supervisors/${userId}/approve`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      
      if (res.ok) {
        setAdvisors(prev => prev.map(a => a.id === userId ? { ...a, is_supervisor: true } : a));
        // Refresh analytics
        await fetchDeanData();
      } else {
        alert("Failed to authorize faculty supervisor license.");
      }
    } catch (err) {
      console.error("License approval failed", err);
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="login-screen" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "var(--bg-dark)" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // GATED: Login Screen if not authenticated as Dean
  if (!isAuthenticated || !user?.is_dean) {
    return (
      <main className="login-screen" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at center, #0f172a 0%, #020617 100%)", padding: "20px" }}>
        <div className="login-card glass" style={{ width: "100%", maxWidth: "420px", padding: "40px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <div className="brand-logo" style={{ width: "50px", height: "50px", fontSize: "1.5rem", fontWeight: 800, background: "linear-gradient(135deg, var(--accent-cyan), #0284c7)", color: "white", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", boxShadow: "0 0 20px rgba(10,200,255,0.2)" }}>
              V
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0 }}>Veritas SaaS Portal</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>Institutional Dean Administrative Console</p>
          </div>

          <form onSubmit={handleDeanLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="form-group">
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px" }}>
                Dean Email Credentials
              </label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ width: "100%", padding: "12px 16px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "white", fontSize: "0.88rem" }}
                required
              />
            </div>

            {authError && (
              <div style={{ fontSize: "0.75rem", color: "#f87171", textAlign: "center", padding: "8px", borderRadius: "6px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                {authError}
              </div>
            )}

            {!user?.is_dean && isAuthenticated && (
              <div style={{ fontSize: "0.75rem", color: "#fbbf24", textAlign: "center", padding: "8px", borderRadius: "6px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)", marginBottom: "10px" }}>
                ⚠️ Your current profile does not have Dean privileges. Login with `dean@veritas.ai` to unlock.
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-audit-pulse"
              style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "0.88rem", background: "linear-gradient(135deg, var(--accent-cyan), #0284c7)", border: "none", color: "white" }}
            >
              🔒 Enter Institutional Console
            </button>
          </form>

          {isAuthenticated && (
            <button 
              onClick={logout}
              style={{ width: "100%", marginTop: "12px", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "0.75rem", textDecoration: "underline", cursor: "pointer" }}
            >
              Log out from current profile ({user?.email})
            </button>
          )}
        </div>
      </main>
    );
  }

  // ACTIVE ADMIN CONSOLE
  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at 10% 20%, #030712 0%, #080e1e 100%)", color: "var(--text-primary)", display: "flex", flexDirection: "column", padding: "40px 60px" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="brand-logo" style={{ width: "36px", height: "36px", fontSize: "1.1rem", fontWeight: 800 }}>V</div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", margin: 0 }}>Veritas Institutional Portal</h1>
            <span style={{ fontSize: "0.68rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 8px", borderRadius: "10px", color: "var(--accent-green)", fontWeight: 700, textTransform: "uppercase" }}>
              Enterprise Admin Active
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Stanford University — Dean of Computer Science Portal
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "0.8rem", color: "white", fontWeight: 600 }}>{user?.full_name || "Dean Administrator"}</span>
            <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-muted)" }}>{user?.email}</span>
          </div>
          <button 
            onClick={logout} 
            className="btn btn-secondary"
            style={{ padding: "6px 12px", fontSize: "0.72rem", background: "rgba(255,255,255,0.04)" }}
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Aggregate Statistics Cards */}
      {analytics && (
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "40px" }}>
          {/* Card 1 */}
          <div className="paper-card glass" style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase" }}>
              Enrollment Volume
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>{analytics.active_students_count}</span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Active Candidates</span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              {analytics.total_theses} research theses initialized program-wide.
            </p>
          </div>

          {/* Card 2 */}
          <div className="paper-card glass" style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-violet)", textTransform: "uppercase" }}>
              Average Originality index
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "var(--accent-green)" }}>
                {analytics.average_originality_index.toFixed(1)}%
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>VSM Originality</span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              Departmental threshold gate: minimum 60% originality.
            </p>
          </div>

          {/* Card 3 */}
          <div className="paper-card glass" style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--accent-green)", textTransform: "uppercase" }}>
              Swarm Socratic dialogs
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
                {analytics.average_socratic_dialogs.toFixed(1)}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Interactions/Student</span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              Total Socratic dialogue velocity tracked by swarms.
            </p>
          </div>

          {/* Card 4 */}
          <div className="paper-card glass" style={{ padding: "20px", border: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#fbbf24", textTransform: "uppercase" }}>
              Supervisor licenses
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
              <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
                {analytics.active_advisor_licenses_count}
              </span>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Approved Advisors</span>
            </div>
            <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "8px 0 0 0" }}>
              Licensed faculty members overseeing student drafts.
            </p>
          </div>
        </section>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "16px", marginBottom: "30px" }}>
        <button
          onClick={() => setActiveTab("cohort")}
          style={{
            padding: "8px 20px",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: activeTab === "cohort" ? "rgba(10,200,255,0.08)" : "transparent",
            border: activeTab === "cohort" ? "1px solid rgba(10,200,255,0.3)" : "1px solid transparent",
            borderRadius: "6px",
            color: activeTab === "cohort" ? "var(--accent-cyan)" : "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🎓 Department Cohort Registry ({cohort.length})
        </button>
        <button
          onClick={() => setActiveTab("advisors")}
          style={{
            padding: "8px 20px",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: activeTab === "advisors" ? "rgba(10,200,255,0.08)" : "transparent",
            border: activeTab === "advisors" ? "1px solid rgba(10,200,255,0.3)" : "1px solid transparent",
            borderRadius: "6px",
            color: activeTab === "advisors" ? "var(--accent-cyan)" : "var(--text-muted)",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          🛡️ Faculty Advisor Licensing ({advisors.length})
        </button>
      </div>

      {isLoadingData ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
          <div className="spinner"></div>
        </div>
      ) : fetchError ? (
        <div style={{ color: "#f87171", textAlign: "center", padding: "30px", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", background: "rgba(239,68,68,0.04)" }}>
          {fetchError}
          <button onClick={fetchDeanData} className="btn btn-secondary" style={{ marginTop: "16px" }}>
            🔄 Retry Fetching
          </button>
        </div>
      ) : activeTab === "cohort" ? (
        /* Student Cohort Grid */
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {cohort.length === 0 ? (
            <div style={{ textAlign: "center", padding: "45px", color: "var(--text-muted)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: "8px" }}>
              No active student research theses found in your department.
            </div>
          ) : (
            cohort.map((student) => (
              <div key={student.id} className="glass" style={{ padding: "24px", borderRadius: "12px", border: student.administrative_hold ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.05)", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: "24px", background: student.administrative_hold ? "rgba(239,68,68,0.01)" : "rgba(255,255,255,0.01)" }}>
                
                {/* Info Block */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "white", margin: 0 }}>{student.student_name}</h3>
                    <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{student.student_email}</span>
                    {student.administrative_hold && (
                      <span style={{ fontSize: "0.62rem", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", padding: "2px 8px", borderRadius: "10px", color: "#f87171", fontWeight: 700, textTransform: "uppercase" }}>
                        🔒 Hold Active
                      </span>
                    )}
                  </div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginTop: "8px", marginBottom: "12px" }}>
                    {student.thesis_title}
                  </h4>
                  
                  {/* Stats Grid inside card */}
                  <div style={{ display: "flex", gap: "24px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    <div>
                      Originality: <span style={{ color: student.originality_score >= 80 ? "var(--accent-green)" : "var(--accent-cyan)", fontWeight: 700 }}>{student.originality_score}%</span>
                    </div>
                    <div>
                      Autosaves: <span style={{ color: "white", fontWeight: 700 }}>{student.saves_count}</span>
                    </div>
                    <div>
                      Swarm Dialogs: <span style={{ color: "white", fontWeight: 700 }}>{student.socratic_dialogs_count}</span>
                    </div>
                    <div>
                      Unlocks: <span style={{ color: "white", fontWeight: 700 }}>{student.unlocked_checkpoints_count} / 4 Milestones</span>
                    </div>
                  </div>
                </div>

                {/* Completion Progress Bar */}
                <div style={{ width: "160px" }}>
                  <span style={{ display: "block", fontSize: "0.68rem", color: "var(--text-secondary)", marginBottom: "6px", fontWeight: 600 }}>
                    Outline Completion Progression
                  </span>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{
                      width: `${(student.unlocked_checkpoints_count / 4) * 100}%`,
                      height: "100%",
                      background: student.unlocked_checkpoints_count === 4 ? "linear-gradient(135deg, var(--accent-green), #059669)" : "linear-gradient(135deg, var(--accent-cyan), #0284c7)"
                    }}></div>
                  </div>
                  <span style={{ display: "block", fontSize: "0.62rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    {student.unlocked_checkpoints_count === 4 ? "✓ Completed intro drafts" : `Drafting Milestone ${student.unlocked_checkpoints_count}`}
                  </span>
                </div>

                {/* Action button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <button
                    onClick={() => handleToggleHold(student.thesis_id, student.administrative_hold)}
                    className="btn"
                    style={{
                      padding: "8px 16px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      background: student.administrative_hold ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                      border: student.administrative_hold ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                      color: student.administrative_hold ? "var(--accent-green)" : "#f87171",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    {student.administrative_hold ? "🔓 Release Hold" : "🔒 Toggle Hold"}
                  </button>
                </div>
              </div>
            ))
          )}
        </section>
      ) : (
        /* Advisor licensing list */
        <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {advisors.map((advisor) => (
            <div key={advisor.id} className="glass" style={{ padding: "20px 24px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h3 style={{ fontSize: "1rem", color: "white", margin: 0, fontWeight: 700 }}>{advisor.full_name}</h3>
                  <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{advisor.email}</span>
                </div>
                <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Registered on {new Date(advisor.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                {advisor.is_supervisor ? (
                  <span style={{ fontSize: "0.72rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", padding: "4px 12px", borderRadius: "20px", color: "var(--accent-green)", fontWeight: 700 }}>
                    ✓ Licensed Advisor
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveSupervisor(advisor.id)}
                    className="btn btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.72rem", background: "linear-gradient(135deg, var(--accent-cyan), #0284c7)", border: "none", color: "white" }}
                  >
                    Approve Faculty License
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
