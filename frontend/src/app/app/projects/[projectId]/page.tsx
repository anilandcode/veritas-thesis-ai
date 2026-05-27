"use client";

import React, { useEffect, useState } from "react";
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
  
  // Staged loading rows progressive states
  const [loadStage, setLoadStage] = useState(1);

  useEffect(() => {
    if (!projectId) return;

    const fetchProjectData = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        
        // Fetch thesis details
        const resThesis = await fetch(`${BACKEND_URL}/thesis/${projectId}`, {
          headers: getAuthHeaders()
        });
        if (!resThesis.ok) throw new Error("Failed to load project details");
        const dataThesis = await resThesis.json();
        setThesis(dataThesis);

        // Fetch outline
        const resOutline = await fetch(`${BACKEND_URL}/thesis/${projectId}/outline`, {
          headers: getAuthHeaders()
        });
        if (resOutline.ok) {
          const dataOutline = await resOutline.json();
          setOutline(dataOutline);
        }

        // Fetch papers
        const resPapers = await fetch(`${BACKEND_URL}/thesis/${projectId}/papers`, {
          headers: getAuthHeaders()
        });
        if (resPapers.ok) {
          const dataPapers = await resPapers.json();
          setSourceCount(dataPapers.length);
        }

        // Fetch claims
        const resClaims = await fetch(`${BACKEND_URL}/thesis/${projectId}/claims`, {
          headers: getAuthHeaders()
        });
        if (resClaims.ok) {
          const dataClaims = await resClaims.json();
          setClaimCount(dataClaims.filter((c: any) => c.verification_status === "Verified").length);
        }

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (isQueryLoading) {
      // Simulate progressive daylight metadata search steps
      const t1 = setTimeout(() => setLoadStage(2), 2000);
      const t2 = setTimeout(() => setLoadStage(3), 4000);
      const t3 = setTimeout(() => {
        setLoadStage(4);
        fetchProjectData();
        // Remove query loading param
        router.replace(`/app/projects/${projectId}`);
      }, 6000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      fetchProjectData();
    }
  }, [projectId, isQueryLoading, getAuthHeaders, router]);

  if (isQueryLoading || isLoading) {
    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "100px auto 0", width: "100%" }}>
        <div className="panel" style={{ padding: "40px", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          <span style={{ fontSize: "36px" }}>🔍</span>
          <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)", marginTop: "16px" }}>
            Finding Relevant Literature
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", maxWidth: "460px", margin: "8px auto 24px" }}>
            Veritas is searching selected academic databases (Semantic Scholar, arXiv, OpenAlex) to retrieve peer-reviewed source metadata for your Evidence Map.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", maxWidth: "420px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--success)" }}>✓ Preparing search keywords</span>
              <span style={{ fontSize: "11px", color: "var(--success)" }}>Success</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: loadStage >= 2 ? "var(--success)" : "var(--text-tertiary)" }}>
                {loadStage >= 2 ? "✓ Searching academic databases" : "● Searching databases..."}
              </span>
              <span style={{ fontSize: "11px", color: loadStage >= 2 ? "var(--success)" : "var(--text-secondary)" }}>
                {loadStage >= 2 ? "Success" : "Active"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: loadStage >= 3 ? "var(--success)" : "var(--text-tertiary)" }}>
                {loadStage >= 3 ? "✓ Harvesting literature metadata" : loadStage === 2 ? "● Harvesting metadata..." : "☐ Harvesting metadata"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {loadStage >= 3 ? "Success" : loadStage === 2 ? "Active" : "Pending"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", fontWeight: 500, color: loadStage >= 4 ? "var(--success)" : "var(--text-tertiary)" }}>
                {loadStage >= 4 ? "✓ Initializing Evidence Map workspace" : loadStage === 3 ? "● Building workspace..." : "☐ Building workspace"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {loadStage >= 4 ? "Success" : loadStage === 3 ? "Active" : "Pending"}
              </span>
            </div>
          </div>

          <div className="loading-rows" style={{ marginTop: "40px" }}>
            <div className="skeleton-row"></div>
            <div className="skeleton-row skeleton-row-three-fourths"></div>
          </div>
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
