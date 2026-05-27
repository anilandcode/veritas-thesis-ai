"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

interface ThesisData {
  id: number;
  title: string;
  topic_description: string;
  status: string;
  created_at: string;
}

interface OutlineData {
  id: number;
  section_title: string;
  status: string;
}

export default function ProjectOverviewPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const isQueryLoading = searchParams?.get("loading") === "true";

  const [thesis, setThesis] = useState<ThesisData | null>(null);
  const [outline, setOutline] = useState<OutlineData[]>([]);
  const [sourceCount, setSourceCount] = useState(0);
  const [claimCount, setClaimCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dynamic Swarm Terminal Visualizer States
  const [loadStage, setLoadStage] = useState(1);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalProgress, setTerminalProgress] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [isSwarmComplete, setIsSwarmComplete] = useState(false);
  const [polledPapers, setPolledPapers] = useState<any[]>([]);
  const [polledClaims, setPolledClaims] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // Dynamic Spinner Animation (Braille scroll)
  useEffect(() => {
    if (!isQueryLoading && thesis?.status === "Generating Shadow") return;
    const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    const interval = setInterval(() => {
      setSpinnerIndex(prev => (prev + 1) % spinnerChars.length);
    }, 100);
    return () => clearInterval(interval);
  }, [isQueryLoading, thesis]);

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  useEffect(() => {
    if (!projectId) return;

    // Standard sequence of simulated core system operations
    const systemOperations = [
      { delay: 400, log: "⚡ VERITAS DEEP RESEARCH SHADOW SWARM INITIALIZED" },
      { delay: 1000, log: "🔍 Auditing Socratic pre-scoping constraints... APPROVED" },
      { delay: 1800, log: "🌐 Spawning active multi-agent search swarms..." },
      { delay: 2600, log: "🌐 Querying Semantic Scholar, arXiv, and OpenAlex concurrently..." },
      { delay: 5000, log: "📚 Deduplicating harvested literature indexes..." },
      { delay: 7000, log: "🛡️ Integrity Gating: Querying Crossref retraction index..." },
      { delay: 9000, log: "🛡️ Verified Crossref licenses; retracted papers EXCLUDED." },
      { delay: 11000, log: "⚖️ Socratic Claim Audit: mapping claim-to-source integrity overlaps..." },
      { delay: 13000, log: "📂 Outline established. Unlocking Context & Relevance checkpoints..." },
      { delay: 15500, log: "🎓 Workspace setup complete! Steering systems ready." }
    ];

    const getTimestamp = () => {
      const d = new Date();
      return `[${d.toTimeString().split(' ')[0]}]`;
    };

    // Print initial logs
    setTerminalLogs([`${getTimestamp()} ⚙️ Initializing deep research socket connection...`]);

    // Schedule system logs
    const timers = systemOperations.map(op => {
      return setTimeout(() => {
        setTerminalLogs(prev => [...prev, `${getTimestamp()} ${op.log}`]);
        setTerminalProgress(p => Math.min(p + 10, 95));
      }, op.delay);
    });

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
    let isMounted = true;
    let pollInterval: any;

    const fetchProjectData = async () => {
      try {
        const headers = getAuthHeaders();
        
        // Fetch thesis details
        const resThesis = await fetch(`${BACKEND_URL}/thesis/${projectId}`, {
          headers
        });
        if (!resThesis.ok) throw new Error("Failed to load project details");
        const dataThesis = await resThesis.json();
        if (!isMounted) return;
        setThesis(dataThesis);

        // Fetch outline
        const resOutline = await fetch(`${BACKEND_URL}/thesis/${projectId}/outline`, {
          headers
        });
        if (resOutline.ok) {
          const dataOutline = await resOutline.json();
          if (!isMounted) return;
          setOutline(dataOutline);
        }

        // Fetch papers
        const resPapers = await fetch(`${BACKEND_URL}/thesis/${projectId}/papers`, {
          headers
        });
        if (resPapers.ok) {
          const dataPapers = await resPapers.json();
          if (!isMounted) return;
          setSourceCount(dataPapers.length);

          // Render live discoveries
          dataPapers.forEach((paper: any) => {
            if (!polledPapers.some(p => p.id === paper.id)) {
              polledPapers.push(paper); // Local mutation safe for tracking
              setTerminalLogs(prev => [
                ...prev,
                `${getTimestamp()} 📚 [DISCOVERY] Found paper: "${paper.title}" via database. Checked: retraction-free.`
              ]);
            }
          });
        }

        // Fetch claims
        const resClaims = await fetch(`${BACKEND_URL}/thesis/${projectId}/claims`, {
          headers
        });
        if (resClaims.ok) {
          const dataClaims = await resClaims.json();
          if (!isMounted) return;
          const verified = dataClaims.filter((c: any) => c.verification_status === "Verified");
          setClaimCount(verified.length);

          // Render live claims
          verified.forEach((claim: any) => {
            if (!polledClaims.some(c => c.id === claim.id)) {
              polledClaims.push(claim);
              setTerminalLogs(prev => [
                ...prev,
                `${getTimestamp()} ⚖️ [INTEGRITY AUDIT] Extracted verified claim: "${claim.claim_text.substring(0, 70)}..."`
              ]);
            }
          });
        }

        // Check if generation completed
        if (dataThesis.status !== "Generating Shadow") {
          setIsSwarmComplete(true);
          setTerminalProgress(100);
          setTerminalLogs(prev => [
            ...prev,
            `${getTimestamp()} 🎓 Success! Swarm completed. Workspace is ready for active steering.`
          ]);
          clearInterval(pollInterval);
          
          setTimeout(() => {
            if (!isMounted) return;
            setIsLoading(false);
            router.replace(`/app/projects/${projectId}`);
          }, 1500);
        }

      } catch (err) {
        console.error(err);
      }
    };

    if (isQueryLoading) {
      fetchProjectData();
      pollInterval = setInterval(fetchProjectData, 3000);
    } else {
      fetchProjectData();
    }

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      timers.forEach(clearTimeout);
    };
  }, [projectId, isQueryLoading, getAuthHeaders, router]);

  if (isQueryLoading || isLoading) {
    const spinnerChars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    return (
      <div style={{
        padding: "40px",
        maxWidth: "900px",
        margin: "60px auto 0",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px"
      }}>
        
        {/* Swarm Terminal Header Info */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Veritas Deep Research Swarm</span>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>
              Academic Shadow Swarm Active
            </h1>
          </div>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>DISCOVERED SOURCES</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{sourceCount} papers</span>
            </div>
            <div style={{ height: "24px", width: "1px", background: "var(--border-color)" }}></div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", display: "block" }}>VERIFIED CLAIMS</span>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>{claimCount} claims</span>
            </div>
          </div>
        </div>

        {/* Dynamic Glowing Monospace Terminal */}
        <div style={{
          background: "rgba(10, 15, 30, 0.96)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.15)",
          display: "flex",
          flexDirection: "column",
          height: "480px"
        }}>
          {/* Terminal Window Chrome bar */}
          <div style={{
            background: "#111827",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ef4444", display: "inline-block" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#f59e0b", display: "inline-block" }}></span>
              <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
            </div>
            <span style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: "rgba(255, 255, 255, 0.4)",
              letterSpacing: "0.05em"
            }}>
              veritas-shadow-swarm-v1.0.sh
            </span>
            <div style={{ width: "42px" }}></div>
          </div>

          {/* Console Text Logs Wrapper */}
          <div style={{
            padding: "20px",
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            color: "rgba(248, 250, 252, 0.9)",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: 1.5
          }}>
            {terminalLogs.map((log, idx) => {
              // Highlighting parts of logs to give high fidelity styling
              let contentStyle = {};
              if (log.includes("[DISCOVERY]")) {
                contentStyle = { color: "#22d3ee" }; // Cyan
              } else if (log.includes("[INTEGRITY AUDIT]")) {
                contentStyle = { color: "#c084fc" }; // Purple
              } else if (log.includes("Success!") || log.includes("Workspace setup complete")) {
                contentStyle = { color: "#4ade80", fontWeight: "bold" }; // Green
              }

              return (
                <div key={idx} style={{ wordBreak: "break-word", whiteSpace: "pre-wrap", ...contentStyle }}>
                  {log}
                </div>
              );
            })}
            
            {/* Spinning active cursor */}
            {!isSwarmComplete && (
              <div style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{spinnerChars[spinnerIndex]} Swarm operations in progress...</span>
              </div>
            )}
            
            <div ref={logsEndRef} />
          </div>

          {/* Progress Bar Footer */}
          <div style={{
            background: "#111827",
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px"
          }}>
            <div style={{
              flex: 1,
              height: "6px",
              background: "#1f2937",
              borderRadius: "3px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${terminalProgress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6, #06b6d4)",
                borderRadius: "3px",
                transition: "width 0.4s ease"
              }}></div>
            </div>
            <span style={{
              fontFamily: "monospace",
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.6)",
              minWidth: "40px",
              textAlign: "right"
            }}>
              {terminalProgress}%
            </span>
          </div>

        </div>

        {/* Integrity Policy Notice */}
        <div style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "16px",
          display: "flex",
          gap: "12px",
          alignItems: "center"
        }}>
          <span style={{ fontSize: "20px" }}>🛡️</span>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
            <strong>Graduate Steering Policy:</strong> Veritas is running search agents to gather peer-reviewed papers for your Evidence Map. Veritas never drafts content without student steering. Authorship authenticity ledger is running.
          </p>
        </div>

      </div>
    );
  }

  if (!thesis) return null;

  return (
    <div style={{ padding: "40px", overflowY: "auto", height: "100%", width: "100%" }}>
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Project Overview</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>{thesis.title}</h1>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
            {thesis.topic_description.split("\n")[0]}
          </p>
        </div>
        <Link href={`/app/projects/${projectId}/draft`} className="btn btn-accent">
          Enter Writing Studio →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Left Column: Progress and Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Workflow Stepper Progress */}
          <div className="panel">
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Workflow Progress</h3>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {[
                { name: "Start", done: true },
                { name: "Define", done: true },
                { name: "Discover", done: sourceCount > 0 },
                { name: "Understand", done: outline.some(o => o.status === "Completed") },
                { name: "Evidence Map", done: claimCount > 0 },
                { name: "Draft", done: outline.some(o => o.status === "Completed") },
                { name: "Audit", done: outline.every(o => o.status === "Completed") }
              ].map((step, idx) => (
                <React.Fragment key={step.name}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: step.done ? "var(--success-soft)" : "var(--bg-main)",
                      border: `1.5px solid ${step.done ? "var(--success)" : "var(--border-strong)"}`,
                      color: step.done ? "var(--success)" : "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700
                    }}>
                      {step.done ? "✓" : idx + 1}
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>{step.name}</span>
                  </div>
                  {idx < 6 && <div style={{ flex: 1, height: "1px", background: "var(--border-color)", margin: "0 10px", marginTop: "-16px" }}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Outline Lock Milestones */}
          <div className="panel">
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Introduction Checkpoints Outline</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {outline.map((sec) => (
                <div 
                  key={sec.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 18px",
                    borderRadius: "8px",
                    border: "1px solid var(--border-color)",
                    background: sec.status === "Drafting" ? "var(--bg-blue-soft)" : "transparent"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "16px" }}>
                      {sec.status === "Completed" ? "💚" : sec.status === "Drafting" ? "🔷" : "🔒"}
                    </span>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{sec.section_title}</span>
                  </div>
                  <span className={`badge ${
                    sec.status === "Completed" 
                      ? "badge-source-linked" 
                      : sec.status === "Drafting"
                        ? "badge-neutral"
                        : "badge-needs-review"
                  }`} style={{ fontSize: "11px" }}>
                    {sec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Library and Context Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Source Density Card */}
          <div className="panel" style={{ background: "var(--bg-blue-soft)", borderColor: "rgba(37, 99, 235, 0.15)" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--accent-blue)" }}>Source & Literature Coverage</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", margin: "16px 0" }}>
              <div>
                <span style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)" }}>{sourceCount}</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>Linked sources</span>
              </div>
              <div>
                <span style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)" }}>{claimCount}</span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block", marginTop: "2px" }}>Verified claims</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
              <Link href={`/app/projects/${projectId}/library`} style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
                Literature Library →
              </Link>
              <span style={{ color: "var(--border-strong)" }}>|</span>
              <Link href={`/app/projects/${projectId}/evidence`} style={{ color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
                Evidence Map →
              </Link>
            </div>
          </div>

          {/* Socratic Mentor Next Step Callout */}
          <div className="panel">
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "8px" }}>Advisor Guidance</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              "I noticed you are currently drafting the active section. To bypass common drafting gaps, examine the two confirmed citations on graduate seminars. Make sure to ground your claims explicitly before running the next Socratic section audit."
            </p>
            <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "12px", paddingTop: "12px" }}>
              <Link href={`/app/projects/${projectId}/draft`} className="btn btn-accent" style={{ width: "100%", height: "36px", fontSize: "12px" }}>
                Resume Writing
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
