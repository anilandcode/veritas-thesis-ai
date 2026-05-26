"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function DesignPreviewPage() {
  const [activeStep, setActiveStep] = useState(2);
  const [textVal, setTextVal] = useState("");

  return (
    <div className="app-container" style={{ overflowY: "auto", display: "block", padding: "40px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Veritas Daylight</span>
          <h1 style={{ fontSize: "36px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Design System & UI Primitives</h1>
        </div>
        <Link href="/" className="btn btn-secondary">
          Back to Home
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "40px" }}>
        
        {/* SECTION 1: Colors & Typography */}
        <section className="panel">
          <h2 style={{ fontSize: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>1. Colors & Typography</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px", marginBottom: "32px" }}>
            <div style={{ background: "var(--bg-main)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#F6F8FC", border: "1px solid #E4E7EC", margin: "0 auto 8px" }}></div>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Canvas</span>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>#F6F8FC</div>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FFFFFF", border: "1px solid #E4E7EC", margin: "0 auto 8px" }}></div>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Surface</span>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>#FFFFFF</div>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#101828", margin: "0 auto 8px" }}></div>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Primary Ink</span>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>#101828</div>
            </div>
            <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#2563EB", margin: "0 auto 8px" }}></div>
              <span style={{ fontSize: "12px", fontWeight: 600 }}>Accent Blue</span>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>#2563EB</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>display-sm (44px)</span>
              <h2 style={{ fontSize: "44px", fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1.12 }}>Quiet academic authority.</h2>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>heading-2 (28px)</span>
              <h3 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.035em" }}>Socratic logic is proof.</h3>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>title-sm (16px)</span>
              <h4 style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.015em" }}>Connecting Literature to Claims</h4>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>body-lg (16px)</span>
              <p style={{ fontSize: "16px", lineHeight: 1.65, color: "var(--text-secondary)" }}>
                Veritas AI acts as an evidence-first mentor that ensures students synthesize arguments correctly. Every core claim is matched against cached literature metadata.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: Buttons & Badges */}
        <section className="panel">
          <h2 style={{ fontSize: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>2. Action Buttons & Status Badges</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <h4 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Buttons</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <button className="btn btn-primary">Primary Dark</button>
                <button className="btn btn-accent">Accent Blue</button>
                <button className="btn btn-secondary">Secondary White</button>
                <button className="btn btn-tertiary">Tertiary Link</button>
                <button className="btn btn-secondary" disabled>Disabled State</button>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Traceable Evidence States</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <span className="badge badge-source-linked">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                  Source linked
                </span>
                <span className="badge badge-needs-review">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                  Needs review
                </span>
                <span className="badge badge-evidence-gap">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                  Evidence gap
                </span>
                <span className="badge badge-neutral">
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                  Draft ready for audit
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: Input Fields & Steppers */}
        <section className="panel">
          <h2 style={{ fontSize: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>3. Academic Form Inputs & Steppers</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="inp-title">Thesis Working Title</label>
              <input
                id="inp-title"
                type="text"
                className="text-field"
                placeholder="e.g. Socratic Steerability in Graduate Seminars"
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="inp-desc">Initial Topic Hypothesis</label>
              <textarea
                id="inp-desc"
                className="text-area"
                placeholder="Explain the core research gap..."
              />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px" }}>Horizontal Progressive Wizard Stepper</h4>
            <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-subtle)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: activeStep >= 1 ? "var(--success)" : "var(--text-ter)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", fontSize: "11px", fontWeight: 700, justifyContent: "center" }}>✓</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Topic</span>
                </div>
                <div style={{ width: "40px", height: "1px", background: "var(--border-strong)" }}></div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: activeStep >= 2 ? "var(--success)" : "var(--text-ter)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", fontSize: "11px", fontWeight: 700, justifyContent: "center" }}>✓</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Question</span>
                </div>
                <div style={{ width: "40px", height: "1px", background: "var(--border-strong)" }}></div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-blue)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", fontSize: "11px", fontWeight: 700, justifyContent: "center" }}>3</span>
                  <span style={{ fontSize: "13px", fontWeight: 600 }}>Sources</span>
                </div>
                <div style={{ width: "40px", height: "1px", background: "var(--border-color)" }}></div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-tertiary)" }}>
                  <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", fontSize: "11px", fontWeight: 700, justifyContent: "center" }}>4</span>
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>Workspace</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button className="btn btn-secondary" style={{ height: "32px", padding: "0 10px", fontSize: "12px" }} onClick={() => setActiveStep(Math.max(1, activeStep - 1))}>Previous</button>
                <button className="btn btn-primary" style={{ height: "32px", padding: "0 10px", fontSize: "12px" }} onClick={() => setActiveStep(Math.min(4, activeStep + 1))}>Next</button>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: Feedback States (Empty & Loading) */}
        <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          
          <div className="panel">
            <h3 style={{ fontSize: "16px", marginBottom: "16px" }}>4. Loading Skeleton States</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>Searching selected database journals asynchronously...</p>
            <div className="loading-rows">
              <div className="skeleton-row"></div>
              <div className="skeleton-row skeleton-row-three-fourths"></div>
              <div className="skeleton-row skeleton-row-half"></div>
              <div className="skeleton-row"></div>
            </div>
          </div>

          <div className="panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: "16px" }}>5. Empty State Primitive</h3>
            <div className="empty-state" style={{ margin: "10px auto 0", padding: "20px", maxWidth: "100%" }}>
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No literature papers confirmed yet</div>
              <div className="empty-state-desc">Define your core question so Veritas can find relevant source citations.</div>
              <button className="btn btn-primary" style={{ height: "36px" }}>Refine Question</button>
            </div>
          </div>

        </section>

        {/* SECTION 5: App Shell Visual Frame Mockup */}
        <section className="panel">
          <h2 style={{ fontSize: "20px", marginBottom: "20px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>6. Workspace App Shell Layout Mockup (Desktop Viewport)</h2>
          
          <div className="glass" style={{ border: "1px solid var(--border-color)", borderRadius: "12px", height: "400px", overflow: "hidden", display: "flex", background: "var(--bg-main)" }}>
            
            {/* Sidebar Shell */}
            <aside style={{ width: "160px", background: "white", borderRight: "1px solid var(--border-color)", display: "flex", flexDirection: "column", padding: "12px" }}>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "black", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 700 }}>V</div>
                <span style={{ fontSize: "12px", fontWeight: 700 }}>Veritas</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "11px", padding: "6px", background: "var(--bg-blue-soft)", color: "var(--accent-blue)", borderRadius: "6px", fontWeight: 600 }}>Home</span>
                <span style={{ fontSize: "11px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>Library</span>
                <span style={{ fontSize: "11px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>Evidence</span>
                <span style={{ fontSize: "11px", padding: "6px", color: "var(--text-secondary)", borderRadius: "6px" }}>Studio</span>
              </div>
            </aside>

            {/* Main Canvas Shell */}
            <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <header style={{ height: "48px", borderBottom: "1px solid var(--border-color)", background: "white", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", fontWeight: 600 }}>Socratic Outline Steering</span>
                <span className="badge badge-source-linked" style={{ fontSize: "10px", padding: "2px 8px" }}>Original</span>
              </header>
              <div style={{ flex: 1, padding: "24px", background: "white", overflowY: "auto" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "6px", marginBottom: "12px" }}>1. Context & Relevance</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Socratic active steering represents a baseline baseline newly available pedagogy. The mentor guides students segment-by-segment by checking term density. Writing progress remains padlocked until a student successfully unlocks preceding checkpoints through synthesis audits.
                </p>
              </div>
            </main>

            {/* Right Inspector Shell */}
            <aside style={{ width: "180px", background: "var(--bg-subtle)", borderLeft: "1px solid var(--border-color)", display: "flex", flexDirection: "column", padding: "16px" }}>
              <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "12px" }}>Socratic Guide</h4>
              <div style={{ padding: "10px", background: "white", border: "1px solid var(--border-color)", borderRadius: "8px", fontSize: "11px", lineHeight: 1.4 }}>
                <strong>How does this connect to Scholar's 2025 finding?</strong> Explain the relevance in the next paragraph.
              </div>
            </aside>

          </div>
        </section>

      </div>
    </div>
  );
}
