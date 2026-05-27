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
  const { getAuthHeaders, setActiveThesisId, activeThesisId } = useAuth();
  const router = useRouter();
  const [activeThesis, setActiveThesis] = useState<ThesisData | null>(null);
  const [projectsList, setProjectsList] = useState<ThesisData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      setIsLoading(true);
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const headers = getAuthHeaders();

      // 1. Fetch all user projects (theses)
      let theses: ThesisData[] = [];
      try {
        const listRes = await fetch(`${BACKEND_URL}/thesis`, { headers });
        if (listRes.ok) {
          theses = await listRes.json();
          setProjectsList(theses);
        }
      } catch (err) {
        console.error("Failed to load projects list", err);
      }

      // 2. Determine active project
      const savedThesisId = localStorage.getItem("veritas_active_thesis_id");
      let activeLoaded = false;

      if (savedThesisId && theses.length > 0) {
        const found = theses.find(t => t.id.toString() === savedThesisId);
        if (found) {
          setActiveThesis(found);
          setActiveThesisId(found.id.toString());
          activeLoaded = true;
        }
      }

      // Fallback: If no active thesis set, but theses list exists, auto-activate the most recent one
      if (!activeLoaded && theses.length > 0) {
        const mostRecent = theses[0];
        setActiveThesis(mostRecent);
        setActiveThesisId(mostRecent.id.toString());
      } else if (theses.length === 0) {
        setActiveThesis(null);
        setActiveThesisId(null);
      }

      setIsLoading(false);
    };

    fetchWorkspaceData();
  }, [getAuthHeaders, activeThesisId, setActiveThesisId]);

  const handleSwitchProject = (id: number) => {
    setActiveThesisId(id.toString());
  };

  const handleCreateNewProject = () => {
    // Clear active thesis so wizard starts fresh
    localStorage.removeItem("veritas_active_thesis_id");
    router.push("/app/projects/new");
  };

  if (isLoading) {
    return (
      <div style={{ padding: "40px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div className="skeleton-row" style={{ height: "40px", width: "300px" }}></div>
        <div className="skeleton-row" style={{ height: "200px" }}></div>
      </div>
    );
  }

  const otherProjects = projectsList.filter(p => activeThesis === null || p.id !== activeThesis.id);

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto", width: "100%", overflowY: "auto", height: "100%" }}>
      
      {/* Welcome Head - Always expose "Start New Project" button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Veritas Home</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>My Research Workspace</h1>
        </div>
        <button onClick={handleCreateNewProject} className="btn btn-accent" style={{ height: "40px", fontSize: "13px" }}>
          <span>+</span> Start new project
        </button>
      </div>

      {activeThesis ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          
          {/* Active Project Highlight */}
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "20px", borderLeft: "4px solid var(--accent-blue)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span className="badge badge-source-linked" style={{ marginBottom: "8px" }}>Active Thesis Canvas</span>
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

          {/* Other Projects Library List */}
          {otherProjects.length > 0 && (
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
                Other Projects Library ({otherProjects.length})
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {otherProjects.map(project => (
                  <div key={project.id} className="panel" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" }}>
                    <div>
                      <h3 style={{ fontSize: "14.5px", fontWeight: 600, color: "var(--text-primary)" }}>{project.title}</h3>
                      <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                        Created {new Date(project.created_at).toLocaleDateString()} · Status: {project.status}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleSwitchProject(project.id)} 
                      className="btn btn-secondary"
                      style={{ height: "32px", fontSize: "12px", padding: "0 14px" }}
                    >
                      Activate Workspace
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

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
          <button onClick={handleCreateNewProject} className="btn btn-primary" style={{ marginTop: "12px" }}>
            Start a new research project
          </button>
        </div>
      )}
    </div>
  );
}
