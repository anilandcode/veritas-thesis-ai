"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ThesisData {
  id: number;
  title: string;
  topic_description: string;
  status: string;
  created_at: string;
}

export default function ResearchHomePage() {
  const { getAuthHeaders } = useAuth();
  const router = useRouter();
  const [activeThesis, setActiveThesis] = useState<ThesisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveProject = async () => {
      setIsLoading(true);
      const savedThesisId = localStorage.getItem("veritas_active_thesis_id");
      
      if (!savedThesisId) {
        setIsLoading(false);
        return;
      }

      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${BACKEND_URL}/thesis/${savedThesisId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setActiveThesis(data);
        } else {
          localStorage.removeItem("veritas_active_thesis_id");
        }
      } catch (err) {
        console.error("Failed to load active project", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveProject();
  }, [getAuthHeaders]);

  if (isLoading) {
    return (
      <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="skeleton-row" style={{ height: "40px", width: "300px" }}></div>
        <div className="skeleton-row" style={{ height: "200px" }}></div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", width: "100%", overflowY: "auto", height: "100%" }}>
      {/* Welcome Head */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Veritas Home</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>My Research Workspace</h1>
        </div>
        {!activeThesis && (
          <Link href="/app/projects/new" className="btn btn-accent">
            <span>+</span> Start research project
          </Link>
        )}
      </div>

      {activeThesis ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {/* Active Project Highlight */}
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px", borderLeft: "4px solid var(--accent-blue)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="badge badge-source-linked" style={{ marginBottom: "8px" }}>Active Thesis</span>
                <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text-primary)" }}>{activeThesis.title}</h2>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
                  {activeThesis.topic_description}
                </p>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: "11px" }}>
                Status: {activeThesis.status}
              </span>
            </div>

            <div style={{ height: "1px", background: "var(--border-color)" }}></div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "16px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>📅 Created: {new Date(activeThesis.created_at).toLocaleDateString()}</span>
                <span>🎓 Level: Graduate Research</span>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <Link href={`/app/projects/${activeThesis.id}`} className="btn btn-secondary">
                  Open Overview
                </Link>
                <Link href={`/app/projects/${activeThesis.id}/draft`} className="btn btn-primary">
                  Enter Writing Studio →
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Tasks Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="panel">
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Suggested Next Task</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                Verify your introductory paragraphs against the literature library. The Socratic Mentor is waiting to review your bibliography references.
              </p>
              <Link href={`/app/projects/${activeThesis.id}/draft`} style={{ fontSize: "13px", color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
                Go to Socratic Guide →
              </Link>
            </div>
            
            <div className="panel">
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Academic Integrity</h3>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: "16px" }}>
                Your progress log is cryptographically signed using authorship verification signatures. Ensure all drafts undergo similarity audits before export.
              </p>
              <Link href="/verify" style={{ fontSize: "13px", color: "var(--accent-blue)", fontWeight: 600, textDecoration: "none" }}>
                Check signatures ledger →
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state" style={{ padding: "64px 32px" }}>
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-title" style={{ fontSize: "18px" }}>No active research projects found</div>
          <div className="empty-state-desc" style={{ fontSize: "14px", marginTop: "4px" }}>
            Veritas AI will act as your Socratic thesis writing mentor. Create a new research project to define your topic, discover databases, and build a literature-supported evidence map.
          </div>
          <Link href="/app/projects/new" className="btn btn-primary" style={{ marginTop: "12px" }}>
            Start a new research project
          </Link>
        </div>
      )}
    </div>
  );
}
