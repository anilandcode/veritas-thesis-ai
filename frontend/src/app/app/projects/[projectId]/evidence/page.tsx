"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";

interface VerifiedClaim {
  id: number;
  claim_text: string;
  supporting_dois: string | null;
  verification_status: string;
  confidence_score: number;
}

export default function EvidenceMapPage() {
  const { getAuthHeaders } = useAuth();
  const params = useParams();
  const projectId = params?.projectId as string;

  const [claims, setClaims] = useState<VerifiedClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchClaims = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/claims`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setClaims(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClaims();
  }, [projectId, getAuthHeaders]);

  return (
    <div style={{ padding: "40px", overflowY: "auto", height: "100%", width: "100%" }}>
      
      {/* Page Title Head */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Argument Map</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Evidence Map</h1>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            Review core claims and their supporting literature citations. Veritas validates assertions strictly against academic databases.
          </p>
        </div>
        <Link href={`/app/projects/${projectId}`} className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-rows">
          <div className="skeleton-row"></div>
          <div className="skeleton-row skeleton-row-three-fourths"></div>
          <div className="skeleton-row skeleton-row-half"></div>
        </div>
      ) : claims.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⚖️</div>
          <div className="empty-state-title">No claims analyzed yet</div>
          <div className="empty-state-desc">
            Claims are extracted automatically from your active sections during Socratic section audits.
          </div>
          <Link href={`/app/projects/${projectId}/draft`} className="btn btn-primary" style={{ marginTop: "8px" }}>
            Open Writing Studio
          </Link>
        </div>
      ) : (
        <div className="panel" style={{ padding: 0, overflow: "hidden", borderRadius: "var(--radius-lg)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: "var(--bg-subtle)", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontWeight: 600 }}>
                <th style={{ padding: "16px 20px" }}>Claim Assertion</th>
                <th style={{ padding: "16px 20px" }}>Supporting DOI References</th>
                <th style={{ padding: "16px 20px" }}>Coverage Status</th>
                <th style={{ padding: "16px 20px" }}>Suggested Revision Path</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(claim => {
                const isVerified = claim.verification_status === "Verified";
                const doiList = claim.supporting_dois ? claim.supporting_dois.split(",") : [];

                return (
                  <tr key={claim.id} style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)", transition: "all 0.15s ease" }}>
                    {/* Claim text */}
                    <td style={{ padding: "20px", fontWeight: 500, color: "var(--text-primary)", maxWidth: "320px", lineHeight: 1.45 }}>
                      "{claim.claim_text}"
                    </td>
                    
                    {/* DOIs list */}
                    <td style={{ padding: "20px", color: "var(--text-secondary)", maxWidth: "240px" }}>
                      {doiList.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {doiList.map(doi => (
                            <span 
                              key={doi}
                              style={{ 
                                fontSize: "11px", 
                                background: "var(--bg-subtle)", 
                                border: "1px solid var(--border-color)", 
                                padding: "2px 6px", 
                                borderRadius: "4px",
                                color: "var(--accent-blue)",
                                fontWeight: 500
                              }}
                            >
                              {doi.trim()}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: "12px", color: "var(--text-tertiary)", fontStyle: "italic" }}>No DOI matched</span>
                      )}
                    </td>

                    {/* Coverage Status */}
                    <td style={{ padding: "20px" }}>
                      <span className={`badge ${isVerified ? "badge-source-linked" : "badge-evidence-gap"}`}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }}></span>
                        {isVerified ? "Source linked" : "Evidence gap"}
                      </span>
                    </td>

                    {/* Next Action / Revision Path */}
                    <td style={{ padding: "20px", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                      {isVerified ? (
                        <span>Synthesize this verified literature claim directly in your active draft paragraphs.</span>
                      ) : (
                        <span style={{ color: "var(--danger)", fontWeight: 500 }}>
                          ⚠️ Add literature references backing this claim, or tone down the assertion in your section draft.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
