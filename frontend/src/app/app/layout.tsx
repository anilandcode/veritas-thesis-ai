"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect to /sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-main)" }}>
        <div className="skeleton-row" style={{ width: "80px", height: "80px", borderRadius: "50%" }}></div>
      </div>
    );
  }

  // Extract active project ID from pathname if present
  const projectMatch = pathname?.match(/\/app\/projects\/([^\/]+)/);
  const activeProjectId = projectMatch ? projectMatch[1] : null;

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

        <nav className="nav-group" style={{ flex: 1 }}>
          <Link href="/app" className={`nav-link ${pathname === "/app" ? "active" : ""}`}>
            <span>🏠</span> Research Home
          </Link>

          {activeProjectId && (
            <>
              <div style={{ height: "1px", background: "var(--border-color)", margin: "12px 12px 6px" }}></div>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", padding: "4px 12px 2px", letterSpacing: "0.05em" }}>
                Active Project
              </div>
              
              <Link href={`/app/projects/${activeProjectId}`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}` ? "active" : ""}`}>
                <span>📊</span> Overview
              </Link>
              <Link href={`/app/projects/${activeProjectId}/library`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}/library` ? "active" : ""}`}>
                <span>📚</span> Library
              </Link>
              <Link href={`/app/projects/${activeProjectId}/evidence`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}/evidence` ? "active" : ""}`}>
                <span>🔍</span> Evidence Map
              </Link>
              <Link href={`/app/projects/${activeProjectId}/draft`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}/draft` ? "active" : ""}`}>
                <span>✍️</span> Writing Studio
              </Link>
              <Link href={`/app/projects/${activeProjectId}/audit`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}/audit` ? "active" : ""}`}>
                <span>⚖️</span> Claim Audit
              </Link>
              <Link href={`/app/projects/${activeProjectId}/export`} className={`nav-link ${pathname === `/app/projects/${activeProjectId}/export` ? "active" : ""}`}>
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
