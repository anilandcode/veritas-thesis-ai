"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout, getAuthHeaders, activeThesisId, setActiveThesisId } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [theses, setTheses] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Redirect to /sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);

  // Load list of all theses dynamically
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTheses = async () => {
      try {
        const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
        const res = await fetch(`${BACKEND_URL}/thesis`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setTheses(data);
        }
      } catch (e) {
        console.error("Failed to load theses in sidebar", e);
      }
    };

    fetchTheses();
  }, [isAuthenticated, getAuthHeaders, activeThesisId]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="skeleton-row" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
      </div>
    );
  }

  // Extract active project ID from pathname if present
  const projectMatch = pathname?.match(/\/app\/projects\/([^\/]+)/);
  const activeProjectId = projectMatch ? projectMatch[1] : activeThesisId;

  const currentActiveProject = theses.find(t => t.id.toString() === activeThesisId);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div style={{ height: "64px", padding: "0 24px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
          <Link href="/app" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div className="brand-logo">V</div>
            <h2 className="brand-title">Veritas AI</h2>
          </Link>
        </div>

        <nav className="nav-group" style={{ flex: 1, position: "relative" }}>
          <Link href="/app" className={`nav-link ${pathname === "/app" ? "active" : ""}`}>
            <span>🏠</span> Research Home
          </Link>

          {activeThesisId && (
            <>
              <div style={{ height: "1px", background: "var(--border-color)", margin: "12px 12px 6px" }}></div>
              
              {/* Project Switcher Selector */}
              <div style={{ padding: "4px 12px 12px", position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(prev => !prev)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: "var(--bg-main)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-primary)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: "6px" }}>
                    📁 {currentActiveProject?.title || "Switch Project..."}
                  </span>
                  <span style={{ fontSize: "9px", color: "var(--text-secondary)" }}>{dropdownOpen ? "▲" : "▼"}</span>
                </button>

                {dropdownOpen && theses.length > 1 && (
                  <div style={{
                    position: "absolute",
                    top: "42px",
                    left: "12px",
                    right: "12px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "6px",
                    boxShadow: "var(--shadow-md)",
                    zIndex: 100,
                    maxHeight: "180px",
                    overflowY: "auto",
                    padding: "4px 0"
                  }}>
                    {theses.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setActiveThesisId(t.id.toString());
                          setDropdownOpen(false);
                          router.push(`/app/projects/${t.id}`);
                        }}
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          border: "none",
                          background: t.id.toString() === activeThesisId ? "var(--bg-blue-soft)" : "transparent",
                          color: t.id.toString() === activeThesisId ? "var(--accent-blue)" : "var(--text-primary)",
                          fontSize: "12px",
                          fontWeight: t.id.toString() === activeThesisId ? 600 : 500,
                          textAlign: "left",
                          cursor: "pointer",
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "background 0.2s ease"
                        }}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", padding: "4px 12px 2px", letterSpacing: "0.05em" }}>
                Active Project
              </div>
              
              <Link href={`/app/projects/${activeThesisId}`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}` ? "active" : ""}`}>
                <span>📊</span> Overview
              </Link>
              <Link href={`/app/projects/${activeThesisId}/library`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}/library` ? "active" : ""}`}>
                <span>📚</span> Library
              </Link>
              <Link href={`/app/projects/${activeThesisId}/evidence`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}/evidence` ? "active" : ""}`}>
                <span>🔍</span> Evidence Map
              </Link>
              <Link href={`/app/projects/${activeThesisId}/draft`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}/draft` ? "active" : ""}`}>
                <span>✍️</span> Writing Studio
              </Link>
              <Link href={`/app/projects/${activeThesisId}/audit`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}/audit` ? "active" : ""}`}>
                <span>⚖️</span> Claim Audit
              </Link>
              <Link href={`/app/projects/${activeThesisId}/export`} className={`nav-link ${pathname === `/app/projects/${activeThesisId}/export` ? "active" : ""}`}>
                <span>📄</span> Export
              </Link>
            </>
          )}

          <div style={{ height: "1px", background: "var(--border-color)", margin: "12px 12px 6px" }}></div>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", padding: "4px 12px 2px", letterSpacing: "0.05em" }}>
            Roles
          </div>
          {user?.is_supervisor && (
            <Link href="/supervisor" className="nav-link">
              <span>👨‍🏫</span> Supervisor Dashboard
            </Link>
          )}
          <Link href="/verify" className="nav-link">
            <span>🛡️</span> Authenticity Check
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg-subtle)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name}
            </span>
            <span style={{ fontSize: "10px", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.email}
            </span>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={{ width: "100%", height: "32px", fontSize: "11px", padding: 0 }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Shell wrapper */}
      <main className="app-main-content">
        {children}
      </main>
    </div>
  );
}
