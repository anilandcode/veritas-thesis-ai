"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { login, register, loginMock, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/app");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!emailInput.trim()) {
      setError("Email address is required.");
      setIsSubmitting(false);
      return;
    }

    if (!passwordInput) {
      setError("Password is required.");
      setIsSubmitting(false);
      return;
    }

    if (activeTab === "register" && !nameInput.trim()) {
      setError("Full name is required to create a scholar profile.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (activeTab === "login") {
        await login(emailInput, passwordInput);
      } else {
        await register(emailInput, passwordInput, nameInput);
      }
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="skeleton-row" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
      </div>
    );
  }

  return (
    <main className="app-container" style={{ display: "flex", background: "var(--bg-main)", minHeight: "100vh" }}>
      {/* Visual columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", minHeight: "100vh" }}>
        
        {/* Left column: Academic Context branding */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px", background: "linear-gradient(135deg, var(--bg-blue-soft), var(--bg-main))", borderRight: "1px solid var(--border-color)" }}>
          <div className="brand-section">
            <div className="brand-logo" style={{ width: "32px", height: "32px", fontSize: "16px" }}>V</div>
            <h1 className="brand-title" style={{ fontSize: "18px" }}>Veritas AI</h1>
          </div>

          <div style={{ maxWidth: "420px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: "20px" }}>
              Research with proof. Write with confidence.
            </h2>
            <p style={{ fontSize: "16px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              Veritas helps you build a highly defensible, literature-backed thesis using structured Socratic guidance that verifies claims, checks plagiarism risk, and establishes absolute academic integrity.
            </p>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
            © 2026 Veritas Academic Systems. Production Grade Authentication.
          </div>
        </div>

        {/* Right column: Clean daylight sign-in / registration card */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
          <div className="panel" style={{ width: "100%", maxWidth: "440px", padding: "40px", boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            
            {/* Header info */}
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>
                {activeTab === "login" ? "Welcome back to Veritas" : "Create your Scholar Profile"}
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                {activeTab === "login" 
                  ? "Access your Socratic outline map and writing studio." 
                  : "Register for an academic-gated research canvas."}
              </p>
            </div>

            {/* Custom Tab Switcher */}
            <div style={{ display: "flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-sm)", padding: "4px", marginBottom: "20px", border: "1px solid var(--border-color)" }}>
              <button
                onClick={() => { setActiveTab("login"); setError(null); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "calc(var(--radius-sm) - 2px)",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "login" ? "var(--bg-main)" : "transparent",
                  color: activeTab === "login" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: activeTab === "login" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab("register"); setError(null); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "calc(var(--radius-sm) - 2px)",
                  border: "none",
                  cursor: "pointer",
                  background: activeTab === "register" ? "var(--bg-main)" : "transparent",
                  color: activeTab === "register" ? "var(--text-primary)" : "var(--text-secondary)",
                  boxShadow: activeTab === "register" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                Register
              </button>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="badge badge-evidence-gap" style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginBottom: "16px", fontSize: "12.5px", display: "block", color: "#B54708", background: "#FEF0C7" }}>
                ⚠️ {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {activeTab === "register" && (
                <div className="form-group">
                  <label className="form-label" htmlFor="name-input">Full Name</label>
                  <input
                    id="name-input"
                    type="text"
                    className="text-field"
                    placeholder="e.g. Dr. Jane Scholar"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Academic or personal email</label>
                <input
                  id="email-input"
                  type="email"
                  className="text-field"
                  placeholder="scholar@university.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Password</label>
                <input
                  id="password-input"
                  type="password"
                  className="text-field"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                style={{ width: "100%", height: "44px", fontSize: "14px", marginTop: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {isSubmitting ? "Authenticating..." : activeTab === "login" ? "Sign In" : "Register Profile"}
              </button>
            </form>

            {/* Separator */}
            <div style={{ display: "flex", alignItems: "center", margin: "24px 0 16px", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
            </div>

            {/* Quick Gated Testing Options (Backward-compatible local mock triggers) */}
            <details style={{ cursor: "pointer", background: "var(--bg-subtle)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <summary style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>⚙️ Gated Tester Demo Profiles</span>
                <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>▼ Click to Expand</span>
              </summary>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                <button
                  onClick={() => {
                    loginMock("scholar@veritas.ai", "Graduate Scholar");
                    router.push("/app");
                  }}
                  className="btn btn-secondary"
                  style={{ width: "100%", height: "36px", fontSize: "12px", justifyContent: "flex-start", padding: "0 10px", background: "var(--bg-main)" }}
                >
                  🎓 Scholar Student Panel (Mock)
                </button>
                <button
                  onClick={() => {
                    loginMock("advisor@veritas.ai", "Dr. Sarah Advisor");
                    router.push("/app");
                  }}
                  className="btn btn-secondary"
                  style={{ width: "100%", height: "36px", fontSize: "12px", justifyContent: "flex-start", padding: "0 10px", background: "var(--bg-main)" }}
                >
                  👨‍🏫 Research Advisor Panel (Mock)
                </button>
                <button
                  onClick={() => {
                    loginMock("dean@veritas.ai", "Dean Arthur Pendelton");
                    router.push("/app");
                  }}
                  className="btn btn-secondary"
                  style={{ width: "100%", height: "36px", fontSize: "12px", justifyContent: "flex-start", padding: "0 10px", background: "var(--bg-main)" }}
                >
                  🛡️ Institutional Dean Panel (Mock)
                </button>
              </div>
            </details>

          </div>
        </div>

      </div>
    </main>
  );
}
