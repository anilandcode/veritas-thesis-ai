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

export default function ClaimAuditPage() {
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

  const unsupportedClaims = claims.filter(c => c.verification_status !== "Verified");
  const verifiedClaims = claims.filter(c => c.verification_status === "Verified");

  return (
    <div style={{ padding: "40px", overflowY: "auto", height: "100%", width: "100%" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px", borderBottom: "1px solid var(--border-color)", paddingBottom: "20px" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Integrity Gate</span>
          <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Claim Audit</h1>
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
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          
          {/* Outstanding Gaps */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600 }}>Evidence Gaps ({unsupportedClaims.length})</h3>
              <span className="badge badge-evidence-gap" style={{ fontSize: "11px" }}>Action Required</span>
            </div>
            
            {unsupportedClaims.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--success)", fontStyle: "italic" }}>
                ✓ No active evidence gaps found. All extracted assertions match traceable bibliography records!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {unsupportedClaims.map(claim => (
                  <div 
                    key={claim.id} 
                    style={{ 
                      padding: "16px", 
                      border: "1px solid rgba(180, 35, 24, 0.15)", 
                      background: "var(--danger-soft)", 
                      borderRadius: "8px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "8px" 
                    }}
                  >
                    <strong style={{ fontSize: "13.5px", color: "var(--danger)" }}>"{claim.claim_text}"</strong>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      This statement was flagged as lacking backing evidence during our local TF-IDF semantic overlap verification. 
                      Ensure at least two distinct peer-reviewed publications containing this claim are cached in your Library.
                    </p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                      <Link href={`/app/projects/${projectId}/draft`} className="btn btn-secondary" style={{ height: "30px", fontSize: "11px", padding: "0 10px" }}>
                        Edit section draft
                      </Link>
                      <Link href={`/app/projects/${projectId}/library`} className="btn btn-secondary" style={{ height: "30px", fontSize: "11px", padding: "0 10px" }}>
                        Search literature database
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Assertions */}
          <div className="panel">
            <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Verified Literature Claims ({verifiedClaims.length})</h3>
            
            {verifiedClaims.length === 0 ? (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                No claims verified yet. Submit drafts in your Writing Studio to trigger automated audits.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {verifiedClaims.map(claim => (
                  <div 
                    key={claim.id} 
                    style={{ 
                      padding: "16px", 
                      border: "1px solid var(--border-color)", 
                      background: "var(--bg-card)", 
                      borderRadius: "8px" 
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <strong style={{ fontSize: "13px", color: "var(--text-primary)" }}>"{claim.claim_text}"</strong>
                      <span className="badge badge-source-linked" style={{ fontSize: "10px", flexShrink: 0 }}>
                        Verified
                      </span>
                    </div>
                    {claim.supporting_dois && (
                      <p style={{ fontSize: "11px", color: "var(--accent-blue)", marginTop: "8px", fontWeight: 500 }}>
                        Linked DOIs: {claim.supporting_dois}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
