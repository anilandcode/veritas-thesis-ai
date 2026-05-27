"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ThesisExportReport {
  title: string;
  student_name: string;
  student_email: string;
  advisor_name: string | null;
  topic_description: string;
  compiled_markdown: string;
  references: Array<{
    title: string;
    authors: string | null;
    year: number | null;
    doi: string | null;
    journal: string | null;
  }>;
  verification_sig: string;
  saves_count: number;
  integrity_score: number;
}

export default function ExportPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const projectId = params?.projectId as string;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  const [exportData, setExportData] = useState<ThesisExportReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const fetchExport = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/export`, {
          headers: getAuthHeaders()
        });
        if (!res.ok) throw new Error("Failed to compile active draft metadata.");
        const data = await res.json();
        setExportData(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load academic export.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExport();
  }, [projectId, getAuthHeaders]);

  const handleCopyMarkdown = () => {
    if (!exportData) return;
    navigator.clipboard.writeText(exportData.compiled_markdown);
    alert("Compiled thesis markdown copied to clipboard!");
  };

  return (
    <div style={{ padding: "40px", overflowY: "auto", height: "100%", width: "100%" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Deliverables</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Export Portfolio</h1>
        </div>
        <Link href={`/app/projects/${projectId}`} className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-rows">
          <div className="skeleton-row"></div>
          <div className="skeleton-row skeleton-row-three-fourths"></div>
        </div>
      ) : error || !exportData ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚠️</div>
          <div className="empty-state-title">Failed to load thesis export portfolio</div>
          <div className="empty-state-desc">{error || "Ensure all sections are finalized and audited."}</div>
          <Link href={`/app/projects/${projectId}/draft`} className="btn btn-primary" style={{ marginTop: "8px" }}>
            Return to Studio
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
          
          {/* Left Column: Markdown Preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="panel" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Draft Compilation Preview</h3>
                <button onClick={handleCopyMarkdown} className="btn btn-secondary" style={{ height: "32px", fontSize: "12px" }}>
                  📋 Copy Markdown
                </button>
              </div>

              <div style={{ 
                flex: 1, 
                maxHeight: "500px", 
                overflowY: "auto", 
                padding: "24px", 
                background: "var(--bg-subtle)", 
                border: "1px solid var(--border-color)", 
                borderRadius: "8px", 
                fontFamily: "var(--font-sans)", 
                fontSize: "14px", 
                lineHeight: 1.7, 
                color: "var(--text-primary)",
                whiteSpace: "pre-line"
              }}>
                {exportData.compiled_markdown || "# Empty Draft Content\n\nBegin writing sections in your Writing Studio to compile draft details."}
              </div>
            </div>
          </div>

          {/* Right Column: Provenance and Citation Ledger */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Provenance Card */}
            <div className="panel" style={{ borderTop: "4px solid var(--success)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--success)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>🛡️</span> Authenticity Provenance
              </h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px", lineHeight: 1.5 }}>
                This student portfolio is verified against background literature references maps using cryptographic checksum hashes.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0", fontSize: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span>Draft Saves:</span>
                  <strong>{exportData.saves_count} autosaves</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                  <span>Integrity Rating:</span>
                  <strong>{exportData.integrity_score.toFixed(1)}%</strong>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Cryptographic Signature</span>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", wordBreak: "break-all", background: "var(--bg-subtle)", padding: "6px", border: "1px solid var(--border-color)", borderRadius: "4px" }}>
                    {exportData.verification_sig}
                  </span>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(exportData.verification_sig);
                  alert("Cryptographic signature copied!");
                }}
                className="btn btn-primary" 
                style={{ width: "100%", height: "36px", fontSize: "12px" }}
              >
                Copy certificate code
              </button>
            </div>

            {/* Bibliography references */}
            <div className="panel">
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "12px" }}>Academic Bibliography</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "240px", overflowY: "auto" }}>
                {exportData.references.length === 0 ? (
                  <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>No sources compiled.</span>
                ) : (
                  exportData.references.map((ref, idx) => (
                    <div key={idx} style={{ fontSize: "12px", color: "var(--text-secondary)", borderBottom: idx < exportData.references.length - 1 ? "1px solid var(--border-color)" : "none", paddingBottom: "8px" }}>
                      <strong>{ref.authors} ({ref.year}).</strong> {ref.title}. <em>{ref.journal || "Journal of Academic Thesis"}</em>.
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
