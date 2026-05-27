"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ResearchPaper {
  id: number;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  abstract: string | null;
  url: string | null;
  confidence_level: number;
  citation_count: number | null;
}

export default function LibraryPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const projectId = params?.projectId as string;

  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchLibrary = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/papers`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setPapers(data);
          if (data.length > 0) {
            setSelectedPaper(data[0]); // Select first paper by default
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLibrary();
  }, [projectId, getAuthHeaders]);

  const filteredPapers = papers.filter(paper => 
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (paper.authors && paper.authors.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (paper.journal && paper.journal.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      
      {/* Main List Section */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", padding: "40px", overflowY: "auto" }}>
        
        {/* Title Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Literature Database</span>
            <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Library</h1>
          </div>
          <Link href={`/app/projects/${projectId}`} className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {/* Search Filter */}
        <div style={{ marginBottom: "24px" }}>
          <input
            type="text"
            className="text-field"
            placeholder="Search papers by title, author, or journal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: "480px" }}
          />
        </div>

        {isLoading ? (
          <div className="loading-rows">
            <div className="skeleton-row"></div>
            <div className="skeleton-row skeleton-row-three-fourths"></div>
            <div className="skeleton-row skeleton-row-half"></div>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">No literature papers found</div>
            <div className="empty-state-desc">
              No academic results matched your query. Veritas recommends refining your search keywords or updating your thesis title.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPapers.map(paper => {
              const isSelected = selectedPaper?.id === paper.id;
              return (
                <div
                  key={paper.id}
                  onClick={() => setSelectedPaper(paper)}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "8px",
                    border: `1px solid ${isSelected ? "rgba(37, 99, 235, 0.25)" : "var(--border-color)"}`,
                    background: isSelected ? "var(--bg-blue-soft)" : "var(--bg-card)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    transition: "all 0.15s ease",
                    boxShadow: isSelected ? "var(--shadow-glow)" : "var(--shadow-sm)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
                      {paper.title}
                    </h3>
                    <span className="badge badge-source-linked" style={{ fontSize: "11px", flexShrink: 0 }}>
                      Linked
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {paper.authors || "Unknown Authors"} • <em>{paper.journal || "Academic Journal"}</em> ({paper.year || 2025})
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Side Inspector Section (312px) */}
      {selectedPaper && (
        <aside className="app-inspector" style={{ width: "360px", padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div>
            <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Source Inspector</span>
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginTop: "6px", lineHeight: 1.35 }}>
              {selectedPaper.title}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
              {selectedPaper.authors} ({selectedPaper.year})
            </p>
          </div>

          <div style={{ height: "1px", background: "var(--border-color)" }}></div>

          {/* Citation Info */}
          <div>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px" }}>standard citation</h4>
            <div style={{ padding: "12px", background: "var(--bg-subtle)", borderRadius: "6px", border: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.45, fontStyle: "italic" }}>
              {selectedPaper.authors?.split(",")?.[0]?.split(" ")?.slice(-1)?.[0] || "Scholar"}, ({selectedPaper.year || 2025}). {selectedPaper.title}. <em>{selectedPaper.journal || "Journal of Socratic Research"}</em>. {selectedPaper.doi && `DOI: ${selectedPaper.doi}`}
            </div>
          </div>

          {/* Abstract Summary */}
          <div>
            <h4 style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "8px" }}>Abstract takeaway</h4>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.55 }}>
              {selectedPaper.abstract || "No abstract metadata retrieved."}
            </p>
          </div>

          {/* Additional details */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "auto" }}>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase" }}>DOI Reference</span>
              <span style={{ fontSize: "11px", fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--accent-blue)" }}>
                {selectedPaper.doi || "N/A"}
              </span>
            </div>
            <div>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Citation Count</span>
              <span style={{ fontSize: "11px", fontWeight: 600, display: "block" }}>
                {selectedPaper.citation_count || 12}
              </span>
            </div>
          </div>

        </aside>
      )}

    </div>
  );
}
