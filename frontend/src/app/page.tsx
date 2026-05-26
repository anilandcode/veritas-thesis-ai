"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function MarketingLandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ background: "var(--bg-main)", minHeight: "100vh", overflowY: "auto", display: "block" }}>
      
      {/* 1. Slim Navigation Header */}
      <header style={{ 
        height: "64px", 
        borderBottom: "1px solid var(--border-color)", 
        background: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(12px)", 
        position: "sticky", 
        top: 0, 
        zIndex: 100, 
        padding: "0 40px", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between" 
      }}>
        <div className="brand-section">
          <div className="brand-logo">V</div>
          <h1 className="brand-title" style={{ fontSize: "16px" }}>Veritas AI</h1>
        </div>

        <nav style={{ display: "flex", gap: "24px", fontSize: "14px", fontWeight: 500 }}>
          <span style={{ color: "var(--text-secondary)", cursor: "default" }}>Product</span>
          <span style={{ color: "var(--text-secondary)", cursor: "default" }}>How it works</span>
          <span style={{ color: "var(--text-secondary)", cursor: "default" }}>Academic integrity</span>
          <Link href="/design-preview" style={{ color: "var(--accent-blue)", textDecoration: "none" }}>
            Design System Preview
          </Link>
        </nav>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {isAuthenticated ? (
            <Link href="/app" className="btn btn-primary" style={{ height: "36px", fontSize: "13px" }}>
              Enter Workspace →
            </Link>
          ) : (
            <>
              <Link href="/sign-in" style={{ color: "var(--text-primary)", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>
                Sign In
              </Link>
              <Link href="/sign-in" className="btn btn-accent" style={{ height: "36px", fontSize: "13px" }}>
                Start free project
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. Centered Elegant Hero Section */}
      <section style={{ 
        padding: "96px 20px 80px", 
        textAlign: "center", 
        maxWidth: "800px", 
        margin: "0 auto", 
        position: "relative" 
      }}>
        {/* Soft daylight blue ambient glow highlight */}
        <div style={{ 
          position: "absolute", 
          width: "500px", 
          height: "250px", 
          top: "50px", 
          left: "calc(50% - 250px)", 
          background: "radial-gradient(circle, rgba(37, 99, 235, 0.05) 0%, transparent 70%)", 
          pointerEvents: "none", 
          zIndex: 0 
        }}></div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ 
            fontSize: "12px", 
            color: "var(--accent-blue)", 
            fontWeight: 600, 
            textTransform: "uppercase", 
            letterSpacing: "0.06em",
            background: "var(--bg-card)",
            padding: "6px 12px",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-full)"
          }}>
            Evidence-first thesis mentoring
          </span>

          <h2 style={{ 
            fontSize: "56px", 
            fontWeight: 600, 
            color: "var(--text-primary)", 
            letterSpacing: "-0.045em", 
            lineHeight: 1.08, 
            marginTop: "20px", 
            marginBottom: "20px" 
          }}>
            Research with proof.<br/>Write with confidence.
          </h2>

          <p style={{ 
            fontSize: "18px", 
            color: "var(--text-secondary)", 
            lineHeight: 1.65, 
            maxWidth: "600px", 
            margin: "0 auto 36px" 
          }}>
            Build a stronger, highly defensible thesis using connected literature, transparent evidence mapping tables, and Socratic progress auditing.
          </p>

          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <Link href="/sign-in" className="btn btn-primary" style={{ height: "46px", padding: "0 24px", fontSize: "14px" }}>
              Start a research project
            </Link>
            <Link href="/design-preview" className="btn btn-secondary" style={{ height: "46px", padding: "0 24px", fontSize: "14px" }}>
              Explore the workflow
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Hero Product Preview Workspace Mockup */}
      <section style={{ maxWidth: "1100px", margin: "0 auto 96px", padding: "0 20px" }}>
        <div className="glass" style={{ 
          border: "1px solid var(--border-color)", 
          borderRadius: "var(--radius-lg)", 
          boxShadow: "var(--shadow-lg)", 
          background: "var(--bg-main)", 
          height: "480px", 
          overflow: "hidden", 
          display: "flex" 
        }}>
          
          {/* Outline panel sidebar mockup */}
          <aside style={{ width: "180px", background: "white", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", padding: "16px" }}>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "20px" }}>
              <div className="brand-logo" style={{ width: "20px", height: "20px", fontSize: "11px" }}>V</div>
              <span style={{ fontSize: "12px", fontWeight: 700 }}>Veritas</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ fontSize: "11.5px", padding: "6px", background: "var(--bg-blue-soft)", color: "var(--accent-blue)", borderRadius: "6px", fontWeight: 600 }}>1. Context & Relevance</span>
              <span style={{ fontSize: "11.5px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>2. Problem Statement 🔒</span>
              <span style={{ fontSize: "11.5px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>3. Objectives 🔒</span>
              <span style={{ fontSize: "11.5px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>4. Significance 🔒</span>
            </div>
          </aside>

          {/* Editor mockup */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", background: "white" }}>
            <header style={{ height: "48px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Introduction Draft Workspace</span>
              <span className="badge badge-source-linked" style={{ fontSize: "10.5px", padding: "2px 8px" }}>Original</span>
            </header>
            <div style={{ flex: 1, padding: "28px", overflowY: "hidden" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "12px" }}>Context & Relevance</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                This research evaluates the efficacy of Socratic active outline steering in graduate writing cohorts. Current AI platforms often compose essays directly on the student's behalf, causing severe academic integrity issues. Veritas AI bypasses this by building a perfect **Evidence Map** in the background, but utilizing this knowledge purely to ask guided questions, verify citation densities, and coach the student...
              </p>
            </div>
          </main>

          {/* Socratic Helper mockup */}
          <aside style={{ width: "240px", background: "var(--bg-subtle)", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", padding: "20px" }}>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "12px" }}>Socratic Mentor</h4>
            <div style={{ padding: "12px", background: "white", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "12px", lineHeight: 1.45 }}>
              <strong>How does your focus on student retention connect to literature?</strong> Explain the relevance in the next paragraph and cite *Scholar, 2025* references.
            </div>
          </aside>

        </div>
      </section>

      {/* 4. Three-Step Workflow section */}
      <section style={{ background: "white", borderTop: "1px solid var(--border-color)", padding: "80px 40px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)" }}>Strict Socratic Writing Workflow</h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginTop: "6px" }}>Veritas locks writing segments ahead to ensure logical drafting progression.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ fontSize: "28px" }}>1️⃣</span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px", marginBottom: "8px" }}>Specify Topic Hypothesis</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Define your working thesis title, clarify initial research questions, and select target databases for literature harvesting.
              </p>
            </div>
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ fontSize: "28px" }}>2️⃣</span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px", marginBottom: "8px" }}>Discover Academic Evidence</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Veritas searches academic databases in the background, populating an interactive **Evidence Map** linking claims directly to source citations.
              </p>
            </div>
            <div className="panel" style={{ padding: "24px" }}>
              <span style={{ fontSize: "28px" }}>3️⃣</span>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginTop: "12px", marginBottom: "8px" }}>Socratic Guided Audits</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Draft sections segment-by-segment. Submit drafts to plagiarism and citation audits to progressively unlock outline sections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer style={{ 
        borderTop: "1px solid var(--border-color)", 
        padding: "32px 40px", 
        textAlign: "center", 
        background: "var(--bg-subtle)", 
        fontSize: "12px", 
        color: "var(--text-tertiary)" 
      }}>
        © 2026 Veritas Academic Systems. Designed for Daylight workspaces. Baseline newly available baseline baseline.
      </footer>

    </div>
  );
}
