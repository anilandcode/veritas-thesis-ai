"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/app");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailInput.trim()) {
      setError("Academic email is required.");
      return;
    }

    try {
      login(emailInput, nameInput || "Graduate Scholar");
      router.push("/app");
    } catch (err: any) {
      setError(err.message || "Failed to authenticate.");
    }
  };

  if (isLoading) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="skeleton-row" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
      </div>
    );
  }

  return (
    <main className="app-container" style={{ display: "flex", background: "var(--bg-main)", minHeight: "100vh" }}>
      {/* Visual columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", width: "100%", height: "100%" }}>
        
        {/* Left column: Academic Context branding */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px", background: "linear-gradient(135deg, var(--bg-blue-soft), var(--bg-main))", borderRight: "1px solid var(--border-color)", height: "100%" }}>
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
            © 2026 Veritas Academic Systems. Baseline Newly Available.
          </div>
        </div>

        {/* Right column: Clean daylight sign-in card */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
          <div className="panel" style={{ width: "100%", maxWidth: "420px", padding: "40px", boxShadow: "var(--shadow-lg)", borderRadius: "var(--radius-lg)" }}>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>Continue to Veritas</h2>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                Access your evidence maps and long-form writing studio.
              </p>
            </div>

            {error && (
              <div className="badge badge-evidence-gap" style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginBottom: "16px", fontSize: "12px", display: "block" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email-input">Academic or personal email</label>
                <input
                  id="email-input"
                  type="email"
                  className="text-field"
                  placeholder="e.g. scholar@university.edu"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="name-input">Full Name (optional)</label>
                <input
                  id="name-input"
                  type="text"
                  className="text-field"
                  placeholder="e.g. Dr. Jane Scholar"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", height: "46px", fontSize: "14px", marginTop: "8px" }}>
                Continue with email
              </button>
            </form>

            <div style={{ display: "flex", alignItems: "center", margin: "20px 0", gap: "12px" }}>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>OR</span>
              <div style={{ flex: 1, height: "1px", background: "var(--border-color)" }}></div>
            </div>

            <button
              onClick={() => {
                login("scholar.google@university.edu", "Google Scholar");
                router.push("/app");
              }}
              className="btn btn-secondary"
              style={{ width: "100%", height: "46px", fontSize: "14px" }}
            >
              Continue with Google
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
