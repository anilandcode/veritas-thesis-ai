"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface ThesisOutline {
  id: number;
  section_key: string;
  section_title: string;
  draft_text: string | null;
  status: string; // Locked, Drafting, Completed
  guiding_hints: string;
}

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

interface VerifiedClaim {
  id: number;
  claim_text: string;
  supporting_dois: string | null;
  verification_status: string;
  confidence_score: number;
}

interface DraftVerification {
  highest_similarity: number;
  plagiarism_risk: string;
  matching_paper_title: string | null;
}

interface SocraticMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface SupervisorComment {
  id: number;
  section_key: string;
  highlighted_quote: string | null;
  comment_text: string;
  is_resolved: boolean;
  created_at: string;
}

export default function WritingStudioPage() {
  const { getAuthHeaders, user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

  // Core Project State
  const [thesisTitle, setThesisTitle] = useState("Graduate Thesis Project");
  const [outline, setOutline] = useState<ThesisOutline[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string>("context");
  const [documentText, setDocumentText] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // Footer Tabs & Data
  const [activeFooterTab, setActiveFooterTab] = useState<"references" | "ledger">("references");
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [verifiedClaims, setVerifiedClaims] = useState<VerifiedClaim[]>([]);
  const [draftIntegrity, setDraftIntegrity] = useState<DraftVerification | null>(null);
  const [plagiarismWarning, setPlagiarismWarning] = useState<string | null>(null);
  const [comments, setComments] = useState<SupervisorComment[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);
 
  // Mentor Chat Panel
  const [rightPanelTab, setRightPanelTab] = useState<"mentor" | "evidence" | "scaffold">("scaffold");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<SocraticMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How does this relate to literature?",
    "What are the research objectives for this introduction?",
    "Check my text for logical consistency"
  ]);
  const [isSending, setIsSending] = useState(false);
  const [activeSteeringMessage, setActiveSteeringMessage] = useState<string | null>(null);

  // Socratic Drafting Scaffolder States
  const [ctxDomain, setCtxDomain] = useState("");
  const [ctxBg, setCtxBg] = useState("");
  const [ctxTension, setCtxTension] = useState("");

  const [probGap, setProbGap] = useState("");
  const [probTension, setProbTension] = useState("");
  const [probConsequence, setProbConsequence] = useState("");

  const [objAim, setObjAim] = useState("");
  const [objScope, setObjScope] = useState("");
  const [objQuestions, setObjQuestions] = useState("");

  const [sigAcademic, setSigAcademic] = useState("");
  const [sigPractical, setSigPractical] = useState("");

  const [compiledScaffold, setCompiledScaffold] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  const handleCompileScaffold = () => {
    let result = "";
    if (activeSectionKey === "context") {
      result = `In recent years, research in the domain of [${ctxDomain || "Insert Topic/Domain"}] has emerged as a critical focus of academic inquiry. Historically, scientific consensus has established that [${ctxBg || "Insert Historical Consensus"}]. However, a key inflection point has arisen because [${ctxTension || "Insert Recent Observation/Shift"}], necessitating a detailed investigation.`;
    } else if (activeSectionKey === "problem") {
      result = `Despite the relevance of this topic, contemporary approaches are fundamentally constrained by [${probGap || "Insert Current Gap/Limitation"}]. This limitation is particularly challenging because [${probTension || "Insert Educational/Clinical Tension"}]. Consequently, without addressing this gap, researchers risk [${probConsequence || "Insert Logical Consequence/Risk"}], leaving a critical vulnerability in the literature.`;
    } else if (activeSectionKey === "objectives") {
      result = `To address these challenges, the overarching aim of this study is to [${objAim || "Insert Primary Goal"}]. Specifically, this investigation will evaluate the dynamics of [${objScope || "Insert Conceptual Strategy/Variables"}]. To guide this process, we formulate the following core research questions: (1) [${objQuestions || "State 1-2 research questions"}].`;
    } else if (activeSectionKey === "significance") {
      result = `The theoretical and practical implications of this study are twofold. From an academic perspective, this work advances literature by [${sigAcademic || "Insert Academic/Theoretical Contribution"}]. From a practical standpoint, the resulting framework directly benefits [${sigPractical || "Insert Practical Beneficiaries"}] by offering a localized, highly reproducible model.`;
    }
    setCompiledScaffold(result);
    setIsCopied(false);
  };

  const handleCopyScaffold = () => {
    navigator.clipboard.writeText(compiledScaffold);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // References
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial Data Seeding & Fetching
  useEffect(() => {
    if (!projectId) return;

    const fetchThesisData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setThesisTitle(data.title);
        }
      } catch (e) {
        console.error("Failed to load project details", e);
      }
    };

    const fetchOutline = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/outline`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setOutline(data);
          
          // Select active drafting section
          const activeSec = data.find((o: ThesisOutline) => o.status === "Drafting");
          if (activeSec) {
            setActiveSectionKey(activeSec.section_key);
            setDocumentText(activeSec.draft_text || "");
          } else if (data.length > 0) {
            setActiveSectionKey(data[0].section_key);
            setDocumentText(data[0].draft_text || "");
          }
        }
      } catch (e) {
        console.error("Failed to load outline", e);
      }
    };

    const fetchLibraryData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/papers`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setPapers(data);
        }
      } catch (e) {
        console.error("Failed to load papers", e);
      }
    };

    const fetchClaimsData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/claims`, {
          headers: getAuthHeaders()
        });
        if (res.ok) {
          const data = await res.json();
          setVerifiedClaims(data);
        }
      } catch (e) {
        console.error("Failed to load claims", e);
      }
    };

    fetchThesisData();
    fetchOutline();
    fetchLibraryData();
    fetchClaimsData();
    fetchComments();
  }, [projectId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/comments`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Failed to load advisor comments", e);
    }
  };

  // 2. Socratic Chat End Auto-Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // 3. Debounced Autosaving & Similarity Integrity Checks
  useEffect(() => {
    if (!projectId || !documentText.trim()) return;

    // Debounce save draft after 1.2s typist cooldown
    const saveTimer = setTimeout(async () => {
      try {
        await fetch(`${BACKEND_URL}/thesis/${projectId}/outline/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            section_key: activeSectionKey,
            draft_text: documentText
          })
        });

        // Trigger dynamic `/verify-draft` plagiarism checks debounced on a 1.5sTypist cooldown
        const resIntegrity = await fetch(`${BACKEND_URL}/thesis/${projectId}/verify-draft`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            section_key: activeSectionKey,
            draft_text: documentText
          })
        });

        if (resIntegrity.ok) {
          const data = await resIntegrity.json();
          setDraftIntegrity(data);
        }
      } catch (e) {
        console.error("Debounced save/verify failure", e);
      }
    }, 1200);

    return () => clearTimeout(saveTimer);
  }, [documentText, activeSectionKey, projectId]);

  // 4. Section Selection & Outline Locking check
  const handleSelectSection = (sec: ThesisOutline) => {
    if (sec.status === "Locked") return;
    setActiveSectionKey(sec.section_key);
    setDocumentText(sec.draft_text || "");
    setPlagiarismWarning(null);
    setDraftIntegrity(null);
  };

  // 5. Supervisor Comments Resolving
  const handleResolveComment = async (commentId: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/comments/${commentId}/resolve`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        setComments(prev => 
          prev.map(c => c.id === commentId ? { ...c, is_resolved: true } : c)
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Caret Cursor Injection of Citations
  const handleCiteSource = (paper: ResearchPaper) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    
    const authorSurname = paper.authors?.split(",")?.[0]?.split(" ")?.slice(-1)?.[0] || "Scholar";
    const citationString = ` [${authorSurname}, ${paper.year || 2025}] `;
    
    const newVal = currentVal.substring(0, start) + citationString + currentVal.substring(end);
    setDocumentText(newVal);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + citationString.length;
    }, 50);
    
    setIsPaperModalOpen(false);
    setSelectedPaper(null);
  };

  // 7. Socratic Chat Message Streaming via SSE
  const handleSendMessage = async (customMsg?: string) => {
    const msgToSend = customMsg || chatMessage;
    if (!msgToSend.trim()) return;

    const newUserMsg: SocraticMessage = {
      role: "user",
      content: msgToSend,
      created_at: new Date().toISOString()
    };
    
    setChatHistory(prev => [...prev, newUserMsg]);
    setChatMessage("");
    setIsSending(true);
    setActiveSteeringMessage("Steering & grading active...");

    try {
      const res = await fetch(`${BACKEND_URL}/socratic/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          thesis_id: parseInt(projectId),
          message: msgToSend,
          section: activeSectionKey,
          stream: true
        }),
      });

      if (!res.ok) throw new Error("Socratic streaming engine failure");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream reader not supported");
      
      const initialAssistantMsg: SocraticMessage = {
        role: "assistant",
        content: "",
        created_at: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, initialAssistantMsg]);
      let accumulatedText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n");
        
        for (const line of lines) {
          if (line.trim().startsWith("data:")) {
            const dataStr = line.trim().slice(5).trim();
            try {
              const data = JSON.parse(dataStr);
              if (data.token) {
                accumulatedText += data.token;
                setChatHistory(prev => {
                  const copy = [...prev];
                  if (copy.length > 0) {
                    copy[copy.length - 1] = {
                      ...copy[copy.length - 1],
                      content: accumulatedText
                    };
                  }
                  return copy;
                });
              }
              if (data.suggestions) {
                setSuggestions(data.suggestions);
              }
              if (data.grading_feedback) {
                if (data.grading_feedback.includes("Logical Gap Bypass")) {
                  setPlagiarismWarning("Pedagogical Intervention: Veritas AI blocks shortcuts. Try to express the arguments in your own words.");
                } else {
                  setPlagiarismWarning(null);
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      // Offline fallback simulator
      setTimeout(() => {
        const simulatedReply: SocraticMessage = {
          role: "assistant",
          content: `### Socratic Mentorship Insight\n\n**Question**:\nHow does your argument on "${msgToSend.slice(0, 40)}" address the core research questions established in your topic details?\n\n**Why this matters**:\nAcademic essays demand cohesive synthesis. Grounding your statements directly in literature reduces plagiarism indexes.\n\n**Sources to inspect**:\n- Review *Scholar, 2025* citations in your Literature Library.\n\n**Next action**:\nSynthesize one additional paper citation in the active outline segment.`,
          created_at: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, simulatedReply]);
        setSuggestions([
          "Help me back this up with citations",
          "What are the research objectives for this introduction?",
          "Check my text for logical consistency"
        ]);
      }, 1200);
    } finally {
      setIsSending(false);
      setActiveSteeringMessage(null);
    }
  };

  // 8. Socratic Gating Audit to Unlock Sections
  const handleTriggerAudit = async () => {
    setIsAuditing(true);
    setAuditMessage("Analyzing writing synthesis, VSM index, and references density...");
    setPlagiarismWarning(null);

    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${projectId}/outline/unlock-next`, {
        method: "POST",
        headers: getAuthHeaders()
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Synthesis audit rejected by pedagogical gates.");
      }

      const data = await res.json();
      setAuditMessage("✓ Audit passed! Section compiled. Next outline segment unlocked.");
      
      // Update outline statuses
      setOutline(data.outline);
      fetchComments();

      // Load next active drafting section
      const nextActive = data.outline.find((o: ThesisOutline) => o.status === "Drafting");
      if (nextActive) {
        setActiveSectionKey(nextActive.section_key);
        setDocumentText(nextActive.draft_text || "");
      }
      
      // Push Socratic welcome message
      const welcomeMsg: SocraticMessage = {
        role: "assistant",
        content: `### Socratic Mentorship\n\n**Next Milestone Unlocked**:\nExcellent synthesis. You've cleared the Socratic audit gates. Let's move onto the **${nextActive?.section_title || "next segment"}** chapter.\n\n**Drafting Goal**:\n${nextActive?.guiding_hints || "Begin your drafting process."}`,
        created_at: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, welcomeMsg]);

    } catch (err: any) {
      console.error(err);
      setPlagiarismWarning(`Socratic Audit Rejected: ${err.message}`);
    } finally {
      setIsAuditing(false);
      setAuditMessage(null);
    }
  };

  // Helper counters
  const getDraftSignature = () => {
    let hash = 0;
    const combined = `${activeSectionKey}:${documentText}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `VERITAS-AUTH-SIG-${Math.abs(hash).toString(16).toUpperCase()}-${new Date().toLocaleDateString()}`;
  };

  const getSynthesizedClaimsCount = () => {
    if (!documentText || verifiedClaims.length === 0) return 0;
    const docWords = documentText.toLowerCase().split(/\W+/);
    let count = 0;
    for (const claim of verifiedClaims) {
      if (claim.verification_status !== "Verified") continue;
      const claimKeywords = claim.claim_text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const overlap = claimKeywords.filter(w => docWords.includes(w));
      if (overlap.length >= 2) {
        count++;
      }
    }
    return count;
  };

  const activeSection = outline.find(o => o.section_key === activeSectionKey);
  const hasUnresolvedComments = comments.some(c => !c.is_resolved);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", overflow: "hidden" }}>
      
      {/* 1. Left Sidebar: Outlines & Checkpoints */}
      <aside className="outline-sidebar" style={{ width: "248px" }}>
        <header className="outline-sidebar-header">
          <span>Outlines</span>
          <span className="brand-tag" style={{ fontSize: "10px" }}>Steering Active</span>
        </header>

        <div className="outline-items-list">
          {outline.map(sec => {
            const isActive = sec.section_key === activeSectionKey;
            return (
              <div
                key={sec.id}
                onClick={() => handleSelectSection(sec)}
                className={`outline-item-card ${isActive ? "active" : ""} ${sec.status === "Completed" ? "completed" : ""} ${sec.status === "Locked" ? "locked" : ""}`}
              >
                <div className="outline-card-title">
                  <span>{sec.section_title}</span>
                  <span style={{ fontSize: "10px" }}>
                    {sec.status === "Completed" && <span style={{ color: "var(--success)" }}>✓ Done</span>}
                    {sec.status === "Drafting" && <span style={{ color: "var(--accent-blue)" }}>● Active</span>}
                    {sec.status === "Locked" && "🔒"}
                  </span>
                </div>
                <p className="outline-card-hints">{sec.guiding_hints}</p>
              </div>
            );
          })}
        </div>

        {/* Advisor Comments Drawer */}
        <div style={{ borderTop: "1px solid var(--border-color)", padding: "16px", background: "var(--bg-card)", maxHeight: "220px", overflowY: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Advisor tasks</span>
            <span className="badge badge-neutral" style={{ fontSize: "10px", padding: "1px 6px" }}>
              {comments.filter(c => !c.is_resolved).length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {comments.length === 0 ? (
              <span style={{ fontSize: "11px", color: "var(--text-tertiary)", fontStyle: "italic", textAlign: "center", display: "block" }}>No pending annotations.</span>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ padding: "8px", border: "1px solid var(--border-color)", borderRadius: "6px", background: c.is_resolved ? "var(--bg-subtle)" : "var(--bg-card)", fontSize: "11.5px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "4px" }}>
                    <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                      📌 {outline.find(o => o.section_key === c.section_key)?.section_title || c.section_key}
                    </strong>
                    {!c.is_resolved && (
                      <button onClick={() => handleResolveComment(c.id)} className="btn btn-secondary" style={{ height: "20px", padding: "0 6px", fontSize: "10px", minWidth: 0 }}>
                        Resolve
                      </button>
                    )}
                  </div>
                  <p style={{ marginTop: "4px", color: "var(--text-secondary)", textDecoration: c.is_resolved ? "line-through" : "none" }}>{c.comment_text}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Actions */}
        <div style={{ padding: "16px", borderTop: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
          {outline.every(o => o.status === "Completed") ? (
            <button
              onClick={() => router.push(`/app/projects/${projectId}/export`)}
              className="btn btn-accent"
              style={{ width: "100%" }}
            >
              ✨ Compile Portfolio ✨
            </button>
          ) : (
            <>
              <button
                onClick={handleTriggerAudit}
                disabled={isAuditing || activeSection?.status !== "Drafting"}
                className="btn btn-primary"
                style={{ width: "100%" }}
              >
                {isAuditing ? "Auditing..." : "Run section audit"}
              </button>
              {auditMessage && <p style={{ fontSize: "11px", color: "var(--accent-blue)", marginTop: "6px", textAlign: "center" }}>{auditMessage}</p>}
            </>
          )}
        </div>
      </aside>

      {/* 2. Center Panel: Document Editor Workspace */}
      <section className="panel-editor">
        
        {/* Editor locks overlays */}
        {activeSection?.status === "Locked" && (
          <div className="editor-locked-overlay">
            <div className="overlay-lock-card">
              <div className="lock-icon-container">🔒</div>
              <h3 className="overlay-lock-title">Segment Padlocked</h3>
              <p className="overlay-lock-desc">
                Clear the preceding Socratic synthesis audit checkpoints to unlock writing access.
              </p>
            </div>
          </div>
        )}

        <header className="panel-header">
          <div className="brand-section">
            <span className="brand-tag">Academic Studio</span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{thesisTitle}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {draftIntegrity && activeSection?.status === "Drafting" && (
              <span className={`badge ${
                draftIntegrity.plagiarism_risk === "High" 
                  ? "badge-evidence-gap" 
                  : draftIntegrity.plagiarism_risk === "Moderate"
                    ? "badge-needs-review"
                    : "badge-source-linked"
              }`} style={{ fontSize: "11px" }}>
                Integrity: {((1 - draftIntegrity.highest_similarity) * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </header>

        {plagiarismWarning && (
          <div style={{ padding: "10px 24px", background: "var(--warning-soft)", borderBottom: "1px solid var(--border-color)", color: "var(--warning)", fontSize: "12px", fontWeight: 500 }}>
            {plagiarismWarning}
          </div>
        )}

        {/* Editor Body Area */}
        <div className="workspace-content">
          <div style={{ background: "var(--bg-subtle)", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "13px" }}>
            <strong style={{ color: "var(--accent-blue)", textTransform: "uppercase", fontSize: "11px", letterSpacing: "0.05em", display: "block", marginBottom: "4px" }}>
              Target: {activeSection?.section_title}
            </strong>
            {activeSection?.guiding_hints}
          </div>

          <textarea
            ref={editorRef}
            className="academic-editor"
            value={documentText}
            onChange={(e) => setDocumentText(e.target.value)}
            placeholder={`Draft your ${activeSection?.section_title} here... Ensure all statements link directly to your confirmed sources bibliography below.`}
            disabled={activeSection?.status !== "Drafting"}
          />
        </div>

        {/* Split Shelf Tab Headers */}
        <div style={{ display: "flex", borderTop: "1px solid var(--border-color)", background: "var(--bg-subtle)", padding: "0 40px", height: "40px", alignItems: "center", gap: "20px" }}>
          <button
            onClick={() => setActiveFooterTab("references")}
            style={{
              background: "transparent",
              border: "none",
              color: activeFooterTab === "references" ? "var(--accent-blue)" : "var(--text-tertiary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              height: "100%",
              borderBottom: activeFooterTab === "references" ? "2px solid var(--accent-blue)" : "2px solid transparent"
            }}
          >
            Connected sources
          </button>
          <button
            onClick={() => setActiveFooterTab("ledger")}
            style={{
              background: "transparent",
              border: "none",
              color: activeFooterTab === "ledger" ? "var(--accent-blue)" : "var(--text-tertiary)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              height: "100%",
              borderBottom: activeFooterTab === "ledger" ? "2px solid var(--accent-blue)" : "2px solid transparent"
            }}
          >
            Authorship Progress Ledger
          </button>
        </div>

        {/* Bottom Workspace Footer */}
        <footer className="workspace-footer" style={{ maxHeight: "240px", overflowY: "auto", borderTop: "1px solid var(--border-color)", padding: "20px 48px" }}>
          {activeFooterTab === "references" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>
                <span>Academic Bibliography Sources ({papers.length})</span>
                <span style={{ color: "var(--accent-blue)" }}>Standard Citation style</span>
              </div>
              <div className="paper-grid">
                {papers.map(paper => (
                  <div key={paper.id} className="paper-card" style={{ padding: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>{paper.title}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{paper.authors?.split(",")?.[0]} ({paper.year})</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <span className="badge badge-source-linked" style={{ fontSize: "10px", padding: "1px 6px" }}>Linked</span>
                      <button onClick={() => handleCiteSource(paper)} className="btn btn-secondary" style={{ height: "26px", fontSize: "10.5px", padding: "0 8px" }}>
                        Cite source
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>authorship hash checksum</span>
                <div style={{ padding: "10px", background: "var(--bg-subtle)", borderRadius: "6px", fontSize: "11.5px", color: "var(--text-secondary)", fontFamily: "monospace", wordBreak: "break-all", border: "1px solid var(--border-color)", marginTop: "6px" }}>
                  {getDraftSignature()}
                </div>
              </div>
              <div>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Synthesis Metrics</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Synthesized Claims:</span>
                    <strong>{getSynthesizedClaimsCount()} claims</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Plagiarism Risk index:</span>
                    <strong style={{ color: draftIntegrity?.plagiarism_risk === "High" ? "var(--danger)" : "var(--success)" }}>
                      {draftIntegrity?.plagiarism_risk || "Low"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </footer>
      </section>

      {/* 3. Right Sidebar: Socratic Mentor Chat & Evidence */}
      <section className="panel-mentor" style={{ width: "360px", borderLeft: "1px solid var(--border-color)" }}>
        
        {/* Tab Headers */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)", height: "48px", flexShrink: 0, alignItems: "center" }}>
          <button
            onClick={() => {
              setRightPanelTab("scaffold");
              setCompiledScaffold("");
            }}
            style={{
              flex: 1.2,
              background: "transparent",
              border: "none",
              color: rightPanelTab === "scaffold" ? "var(--accent-blue)" : "var(--text-tertiary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              height: "100%",
              borderBottom: rightPanelTab === "scaffold" ? "2.5px solid var(--accent-blue)" : "2px solid transparent"
            }}
          >
            📝 Drafting Scaffold
          </button>
          <button
            onClick={() => setRightPanelTab("mentor")}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: rightPanelTab === "mentor" ? "var(--accent-blue)" : "var(--text-tertiary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              height: "100%",
              borderBottom: rightPanelTab === "mentor" ? "2.5px solid var(--accent-blue)" : "2px solid transparent"
            }}
          >
            🦉 Socratic Mentor
          </button>
          <button
            onClick={() => setRightPanelTab("evidence")}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: rightPanelTab === "evidence" ? "var(--accent-blue)" : "var(--text-tertiary)",
              fontSize: "11px",
              fontWeight: 600,
              cursor: "pointer",
              height: "100%",
              borderBottom: rightPanelTab === "evidence" ? "2.5px solid var(--accent-blue)" : "2px solid transparent"
            }}
          >
            🔍 Evidence
          </button>
        </div>

        {rightPanelTab === "scaffold" ? (
          <div style={{ padding: "20px", overflowY: "auto", height: "calc(100% - 48px)", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Socratic Scaffolder</span>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", marginTop: "2px" }}>
                {activeSectionKey === "context" && "Context & Relevance Helper"}
                {activeSectionKey === "problem" && "Problem Statement Helper"}
                {activeSectionKey === "objectives" && "Research Objectives Helper"}
                {activeSectionKey === "significance" && "Significance of Study Helper"}
                {!["context", "problem", "objectives", "significance"].includes(activeSectionKey) && "Drafting Scaffold Helper"}
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.45 }}>
                Answer these simple Socratic questions to compile a structured sentence outline with academic transition starters.
              </p>
            </div>

            <div style={{ height: "1px", background: "var(--border-color)" }}></div>

            {/* Context & Relevance Questionnaire */}
            {activeSectionKey === "context" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>1. Scope / General Domain</label>
                  <input
                    type="text"
                    className="text-field"
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. Panadol medicine effects on Asian People"
                    value={ctxDomain}
                    onChange={(e) => setCtxDomain(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>2. Historical Context / Consensus</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. Panadol is a globally used analgesic with high efficacy in Western clinical trials"
                    value={ctxBg}
                    onChange={(e) => setCtxBg(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>3. Modern Tension / Recent Observation</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. clinical reports indicate variations in metabolic latency in Asian genetic pools"
                    value={ctxTension}
                    onChange={(e) => setCtxTension(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Problem Statement Questionnaire */}
            {activeSectionKey === "problem" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>1. Current Gap / Limitation</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. existing dosing guidelines rely entirely on data collected from Western control cohorts"
                    value={probGap}
                    onChange={(e) => setProbGap(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>2. Core Practical / Empirical Tension</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. doctors must prescribe dosage blindly without regional bio-equivalence profiles"
                    value={probTension}
                    onChange={(e) => setProbTension(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>3. Logical Consequence / Risk</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. patient safety risks increase, or candidates suffer sub-therapeutic dosing"
                    value={probConsequence}
                    onChange={(e) => setProbConsequence(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Research Objectives Questionnaire */}
            {activeSectionKey === "objectives" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>1. Primary Research Aim</label>
                  <input
                    type="text"
                    className="text-field"
                    style={{ padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. map localized metabolic tolerances and regulatory gaps"
                    value={objAim}
                    onChange={(e) => setObjAim(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>2. Strategy / Target Variables</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. correlating pharmacokinetic half-lives with localized genetic markers"
                    value={objScope}
                    onChange={(e) => setObjScope(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>3. Sub-Questions / Hypotheses</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "50px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. Do regional liver enzyme variations correlate with altered clearance latency?"
                    value={objQuestions}
                    onChange={(e) => setObjQuestions(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Significance of Study Questionnaire */}
            {activeSectionKey === "significance" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>1. Theoretical / Academic Value</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "70px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. bridging the gap between pharmacogenetic literature and public drug regulation registries"
                    value={sigAcademic}
                    onChange={(e) => setSigAcademic(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "11px", fontWeight: 600 }}>2. Practical Beneficiaries & Impact</label>
                  <textarea
                    className="text-area"
                    style={{ minHeight: "70px", padding: "6px 10px", fontSize: "12px" }}
                    placeholder="e.g. clinical practitioners in East Asia and localized drug approval policy creators"
                    value={sigPractical}
                    onChange={(e) => setSigPractical(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Fallback for other outline keys */}
            {!["context", "problem", "objectives", "significance"].includes(activeSectionKey) && (
              <div style={{ padding: "20px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "12.5px" }}>
                Scaffolding outlines are optimized for standard thesis introductory chapters (Context, Problem, Objectives, Significance). Select one of these outline elements to begin.
              </div>
            )}

            {["context", "problem", "objectives", "significance"].includes(activeSectionKey) && (
              <button
                type="button"
                className="btn btn-accent"
                onClick={handleCompileScaffold}
                style={{ width: "100%", height: "36px", marginTop: "4px" }}
              >
                ✨ Compile Socratic Scaffold
              </button>
            )}

            {/* Compiled Scaffold Display */}
            {compiledScaffold && (
              <div style={{
                background: "var(--bg-subtle)",
                border: "1.5px solid var(--accent-blue)",
                borderRadius: "8px",
                padding: "16px",
                marginTop: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.05)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--accent-blue)", letterSpacing: "0.05em" }}>YOUR ACADEMIC SKELETON</span>
                  <button
                    onClick={handleCopyScaffold}
                    className="btn btn-secondary"
                    style={{ height: "24px", fontSize: "10.5px", padding: "0 10px", minWidth: 0 }}
                  >
                    {isCopied ? "✓ Copied" : "📋 Copy"}
                  </button>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>
                  {compiledScaffold}
                </p>
                <div style={{ height: "1px", background: "var(--border-color)" }}></div>
                <div style={{ display: "flex", gap: "6px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "14px" }}>💡</span>
                  <p style={{ fontSize: "11px", color: "var(--text-tertiary)", lineHeight: 1.45, margin: 0 }}>
                    <strong>Pedagogical steering hint:</strong> Paste this transition template into the main document canvas on the left. Expand it by adding your detailed arguments, and use our Connected Bibliography sources below to verify your statements.
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : rightPanelTab === "mentor" ? (
          <div style={{ display: "flex", flexDirection: "column", height: "calc(100% - 48px)" }}>
            {/* Chat Messages */}
            <div className="chat-thread" style={{ flex: 1 }}>
              {chatHistory.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-tertiary)" }}>
                  <span style={{ fontSize: "28px" }}>🦉</span>
                  <p style={{ fontSize: "13px", marginTop: "10px", lineHeight: 1.5 }}>
                    Hello! I am your Socratic thesis writing mentor. Send me a message or outline a drafting concern to begin our coaching dialogue.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-bubble-container ${msg.role === "user" ? "chat-bubble-container-user" : ""}`}>
                    <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
                      {/* Formatted rendering support */}
                      <p style={{ whiteSpace: "pre-line" }}>{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="chat-bubble-container">
                  <div className="chat-bubble chat-bubble-assistant" style={{ fontStyle: "italic", opacity: 0.6 }}>
                    🦉 {activeSteeringMessage || "Typing Socratic advice..."}
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="suggestions-box">
                {suggestions.map(s => (
                  <button key={s} onClick={() => handleSendMessage(s)} className="suggestion-pill">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input"
                placeholder="Ask your academic mentor..."
                value={chatMessage}
                onChange={e => setChatMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
              />
              <button onClick={() => handleSendMessage()} className="btn btn-primary" style={{ padding: "0 14px", height: "44px" }}>
                Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: "24px", overflowY: "auto", height: "100%", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Active Claims verification</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px", lineHeight: 1.45 }}>
                Verify that assertions in your introductory drafts map onto literature citations cleanly.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {verifiedClaims.map(c => {
                const isV = c.verification_status === "Verified";
                return (
                  <div key={c.id} style={{ padding: "12px", border: "1px solid var(--border-color)", borderRadius: "8px", background: "var(--bg-card)" }}>
                    <span style={{ fontSize: "12px", display: "block", color: "var(--text-primary)", fontWeight: 500 }}>"{c.claim_text}"</span>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                      <span className={`badge ${isV ? "badge-source-linked" : "badge-evidence-gap"}`} style={{ fontSize: "9.5px", padding: "1px 6px" }}>
                        {isV ? "Source linked" : "Evidence gap"}
                      </span>
                      {c.supporting_dois && (
                        <span style={{ fontSize: "10px", color: "var(--accent-blue)" }}>{c.supporting_dois.split(",")[0]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
