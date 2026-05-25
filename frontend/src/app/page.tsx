"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/app/context/AuthContext";

// Types matching backend Pydantic schemas
interface SocraticMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ResearchPaper {
  id: number;
  title: string;
  authors?: string;
  journal?: string;
  year?: number;
  doi?: string;
  abstract?: string;
  url?: string;
  citation_count: number;
  confidence_level: number;
}

interface VerifiedClaim {
  id: number;
  thesis_id: number;
  section: string;
  claim_text: string;
  supporting_dois: string;
  confidence_score: number;
  verification_status: "Verified" | "Unverified";
  created_at: string;
}

interface ThesisOutline {
  id: number;
  thesis_id: number;
  section_title: string;
  section_key: string;
  guiding_hints?: string;
  status: "Locked" | "Drafting" | "Completed";
  draft_text: string;
  created_at: string;
  updated_at: string;
}

interface DraftVerification {
  highest_similarity: number;
  matching_paper_title?: string;
  matching_paper_doi?: string;
  plagiarism_risk: "High" | "Moderate" | "Low";
}

interface SupervisorComment {
  id: number;
  thesis_id: number;
  section_key: string;
  highlighted_quote?: string | null;
  comment_text: string;
  is_resolved: boolean;
  created_at: string;
}

interface ThesisExportReport {
  title: string;
  student_name: string;
  student_email: string;
  advisor_name?: string | null;
  topic_description: string;
  compiled_markdown: string;
  references: ResearchPaper[];
  verification_sig: string;
  saves_count: number;
  integrity_score: number;
  interaction_count: number;
  is_fully_completed: boolean;
  resolved_comments_count: number;
  total_comments_count: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function Home() {
  const { isAuthenticated, user, login, logout, getAuthHeaders, isLoading: authLoading } = useAuth();
  
  // Login form inputs
  const [emailInput, setEmailInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Application steps inside dashboard: 
  // 0: Setup / Initial Topic Form
  // 1: Shadow Thesis background generation screen
  // 2: Main Socratic split screen workspace
  const [step, setStep] = useState<0 | 1 | 2>(0);
  
  // Thesis state
  const [thesisId, setThesisId] = useState<number | null>(null);
  const [thesisTitle, setThesisTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [thesisStatus, setThesisStatus] = useState("Drafting");
  const [documentText, setDocumentText] = useState("");
  
  // Active Outline Socratic checkpoints
  const [outline, setOutline] = useState<ThesisOutline[]>([]);
  const [activeSectionKey, setActiveSectionKey] = useState<string>("context");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  // Interactive Paper Deep-dive modals states
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportData, setExportData] = useState<ThesisExportReport | null>(null);
  const [isExportLoading, setIsExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Bottom drawer shelf navigation tabs
  const [activeFooterTab, setActiveFooterTab] = useState<"references" | "ledger">("references");

  // Chat state
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<SocraticMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "How do I start drafting the Context & Relevance section?",
    "What are the core research objectives?",
    "Show me academic sources for this topic"
  ]);
  const [isSending, setIsSending] = useState(false);
  const [activeSteeringMessage, setActiveSteeringMessage] = useState<string | null>(null);
  
  // Research state
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [verifiedClaims, setVerifiedClaims] = useState<VerifiedClaim[]>([]);
  const [draftIntegrity, setDraftIntegrity] = useState<DraftVerification | null>(null);
  const [plagiarismWarning, setPlagiarismWarning] = useState<string | null>(null);
  const [comments, setComments] = useState<SupervisorComment[]>([]);
  
  const hasUnresolvedComments = comments.some(c => !c.is_resolved);

  const getDynamicSuggestions = () => {
    const outstandingComments = comments.filter(c => !c.is_resolved);
    const commentSteers = outstandingComments.map(c => `Help me resolve advisor comment: "${c.comment_text.slice(0, 45)}..."`);
    return [...commentSteers, ...suggestions].slice(0, 5);
  };
  
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null); // Caret editor ref!

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Handle Authentication submit
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    if (!emailInput) {
      setAuthError("Email is required");
      return;
    }
    
    // Process login or signup and autoprovision
    login(emailInput, nameInput || "Graduate Scholar");
  };

  // Handle thesis creation & trigger Shadow Thesis generation
  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thesisTitle || !topicDescription) return;

    setStep(1); // Set to Loading state

    try {
      const res = await fetch(`${BACKEND_URL}/thesis/create`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders() // Pass secure JWT token header!
        },
        body: JSON.stringify({
          title: thesisTitle,
          topic_description: topicDescription,
        }),
      });

      if (!res.ok) throw new Error("Failed to initialize thesis");
      const data = await res.json();
      setThesisId(data.id);
      
      // Start polling for status changes (Shadow Engine synthesis)
      pollThesisStatus(data.id);
      
    } catch (err) {
      console.error("Backend offline or connection failed. Running simulated model fallback.", err);
      simulateShadowGeneration();
    }
  };

  // Poll backend until status moves from "Generating Shadow" to "Drafting"
  const pollThesisStatus = async (id: number) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/thesis/${id}`, {
          headers: getAuthHeaders() // Secure query!
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.status === "Drafting") {
          clearInterval(interval);
          setThesisStatus("Drafting");
          
          // Fetch research papers & shadow content
          await fetchPapers(id);
          await fetchClaims(id);
          await fetchOutline(id); // Fetch Socratic checkpoints outline!
          
          // Seed initial Socratic message
          setChatHistory([
            {
              role: "assistant",
              content: `Welcome, ${user?.full_name || "Scholar"}! I've researched and synthesized your shadow ground-truth overview and indexed real literature references.\n\nLet's write a powerful Introduction. What core problem does your thesis aim to solve?`,
              created_at: new Date().toISOString()
            }
          ]);
          
          setStep(2); // Active Workspace
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    }, 2000);
  };

  const fetchComments = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${id}/comments`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch comments", err);
    }
  };

  const handleResolveComment = async (commentId: number) => {
    if (!thesisId) {
      // Mock simulation fallback
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, is_resolved: true } : c));
      return;
    }
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/comments/${commentId}/resolve`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        if (thesisId) await fetchComments(thesisId);
      } else {
        alert("Failed to resolve Socratic comment.");
      }
    } catch (err) {
      console.error("Failed to resolve comment", err);
    }
  };

  // Fetch the 4 Socratic checklist checkpoints
  const fetchOutline = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${id}/outline`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOutline(data);
        fetchComments(id);
        
        // Find current section in "Drafting" status and load text
        const drafting = data.find((o: ThesisOutline) => o.status === "Drafting");
        if (drafting) {
          setActiveSectionKey(drafting.section_key);
          setDocumentText(drafting.draft_text || "");
        } else if (data.length > 0) {
          setActiveSectionKey(data[0].section_key);
          setDocumentText(data[0].draft_text || "");
        }
      }
    } catch (err) {
      console.error("Error fetching outline", err);
    }
  };

  // Fallback Simulation for offline backend
  const simulateShadowGeneration = () => {
    setTimeout(() => {
      setThesisStatus("Drafting");
      setPapers([
        {
          id: 1,
          title: `Recent Advances in ${thesisTitle}`,
          authors: "Dr. A. Scholar, Prof. B. Academic",
          journal: "International Journal of AI and Education",
          year: 2025,
          doi: "10.1000/mock.doi.1",
          citation_count: 42,
          confidence_level: 9.8
        },
        {
          id: 2,
          title: `Ethical Considerations of ${thesisTitle} Systems`,
          authors: "Jane Doe, John Smith",
          journal: "ACM Transactions on Computing",
          year: 2026,
          doi: "10.1000/mock.doi.2",
          citation_count: 15,
          confidence_level: 9.2
        }
      ]);
      setVerifiedClaims([
        {
          id: 1,
          thesis_id: 1,
          section: "Introduction",
          claim_text: `Socratic tutoring agents significantly improve student long-term knowledge retention compared to passive learning structures.`,
          supporting_dois: "10.1000/mock.doi.1, 10.1000/mock.doi.2",
          confidence_score: 2,
          verification_status: "Verified",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          thesis_id: 1,
          section: "Introduction",
          claim_text: `Background 'Shadow' models must maintain a confidence threshold of at least 9.0/10 before triggering Socratic mentoring.`,
          supporting_dois: "10.1000/mock.doi.2",
          confidence_score: 1,
          verification_status: "Unverified",
          created_at: new Date().toISOString()
        }
      ]);
      simulateOutline();
      setComments([
        {
          id: 101,
          thesis_id: 1,
          section_key: "context",
          highlighted_quote: "Socratic tutoring",
          comment_text: "Please provide direct academic literature validating the active learning efficacy of Socratic tutoring over traditional lecture methods.",
          is_resolved: false,
          created_at: new Date().toISOString()
        },
        {
          id: 102,
          thesis_id: 1,
          section_key: "objectives",
          highlighted_quote: "precision of objectives",
          comment_text: "Ensure objectives explicitly measure cognitive overload metrics alongside knowledge retention rates.",
          is_resolved: false,
          created_at: new Date().toISOString()
        }
      ]);
      
      setChatHistory([
        {
          role: "assistant",
          content: `Welcome to Veritas, ${user?.full_name || "Scholar"}! I've compiled a background ground truth ("Shadow Thesis") for your study of ${thesisTitle} and indexed 2 verified research papers.\n\nLet's write the Introduction. What is the core problem that makes this topic urgent?`,
          created_at: new Date().toISOString()
        }
      ]);
      setStep(2);
    }, 4000);
  };

  const simulateOutline = () => {
    const mockOutline: ThesisOutline[] = [
      {
        id: 1,
        thesis_id: 1,
        section_title: "Context & Relevance",
        section_key: "context",
        guiding_hints: `Establish the broader domain of '${thesisTitle}'. Synthesize historical and modern active learning theories.`,
        status: "Drafting",
        draft_text: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        thesis_id: 1,
        section_title: "Problem Statement",
        section_key: "problem",
        guiding_hints: `Examine the core limitations in Socratic AI environments. Explicitly declare the critical gap (e.g. passive retrieval vs student agency).`,
        status: "Locked",
        draft_text: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 3,
        thesis_id: 1,
        section_title: "Research Objectives",
        section_key: "objectives",
        guiding_hints: `Formulate 2-3 precise research questions. Define parameters to evaluate Socratic tutoring effectiveness.`,
        status: "Locked",
        draft_text: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 4,
        thesis_id: 1,
        section_title: "Significance of Study",
        section_key: "significance",
        guiding_hints: `Argue the educational value of Socratic AI systems. Explain how this method drops academic plagiarism.`,
        status: "Locked",
        draft_text: "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setOutline(mockOutline);
    setActiveSectionKey("context");
    setDocumentText("");
  };

  const fetchClaims = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${id}/claims`, {
        headers: getAuthHeaders() // Secure query!
      });
      if (res.ok) {
        const data = await res.json();
        setVerifiedClaims(data);
      }
    } catch (err) {
      console.error("Error fetching claims", err);
    }
  };

  const fetchPapers = async (id: number) => {
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${id}/papers`, {
        headers: getAuthHeaders() // Secure query!
      });
      if (res.ok) {
        const data = await res.json();
        setPapers(data);
      }
    } catch (err) {
      console.error("Error fetching papers", err);
    }
  };

  const verifyDraftSimilarity = async (text: string) => {
    if (!text || !thesisId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${thesisId}/verify-draft`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({ text })
      });
      if (res.ok) {
        const data = await res.json();
        setDraftIntegrity(data);
        
        // Show real-time warning in the visual alerts banner based on risk levels
        if (data.plagiarism_risk === "High") {
          setPlagiarismWarning(
            `Plagiarism Alert: Draft matches "${data.matching_paper_title}" by ${(data.highest_similarity * 100).toFixed(0)}%. Rephrase and cite!`
          );
        } else if (data.plagiarism_risk === "Moderate") {
          setPlagiarismWarning(
            `Citation Warning: Paragraph has moderate term overlap (${(data.highest_similarity * 100).toFixed(0)}%) with "${data.matching_paper_title}". Add citation.`
          );
        } else {
          setPlagiarismWarning(null);
        }
      }
    } catch (err) {
      console.error("Error verifying draft similarity", err);
    }
  };

  // Debounced live typing plagiarism check
  useEffect(() => {
    if (!documentText || step !== 2 || !thesisId || !activeSectionKey) {
      setDraftIntegrity(null);
      return;
    }

    const currentSec = outline.find(o => o.section_key === activeSectionKey);
    if (currentSec && currentSec.status !== "Drafting") {
      setDraftIntegrity(null);
      setPlagiarismWarning(null);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      verifyDraftSimilarity(documentText);
    }, 1500);
    
    return () => clearTimeout(timeoutId);
  }, [documentText, step, thesisId, activeSectionKey, outline]);

  // Synchronize document text to local outline state immediately when user types
  useEffect(() => {
    if (step === 2 && activeSectionKey) {
      setOutline(prev => prev.map(o => o.section_key === activeSectionKey ? { ...o, draft_text: documentText } : o));
    }
  }, [documentText]);

  // Debounced draft autosave hook
  useEffect(() => {
    if (step !== 2 || !thesisId || !activeSectionKey) return;
    
    const timeoutId = setTimeout(() => {
      const activeSec = outline.find(o => o.section_key === activeSectionKey);
      if (activeSec && documentText !== activeSec.draft_text && activeSec.status === "Drafting") {
        saveDraft(activeSectionKey, documentText);
      }
    }, 1200); // 1.2s debounce
    
    return () => clearTimeout(timeoutId);
  }, [documentText, activeSectionKey, step, thesisId]);

  const saveDraft = async (sectionKey: string, text: string) => {
    if (!thesisId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${thesisId}/outline/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          section_key: sectionKey,
          text: text
        })
      });
      if (res.ok) {
        const data = await res.json();
        setOutline(data);
      }
    } catch (err) {
      console.error("Autosave draft failed", err);
    }
  };

  // Switch between sections
  const handleSelectSection = (section: ThesisOutline) => {
    if (section.status === "Locked") {
      alert("This section is locked! You must pass the Socratic Audit of your current drafting section to unlock it.");
      return;
    }
    
    // Save current section text locally
    setOutline(prev => prev.map(o => o.section_key === activeSectionKey ? { ...o, draft_text: documentText } : o));
    
    // Select new section
    setActiveSectionKey(section.section_key);
    setDocumentText(section.draft_text || "");
    
    // Clear warnings
    setPlagiarismWarning(null);
    setDraftIntegrity(null);
  };

  // Trigger Socratic Audit / unlock next section
  const handleTriggerAudit = async () => {
    if (!thesisId) {
      // Mock simulation fallback
      setIsAuditing(true);
      setAuditMessage("Analyzing academic depth & integrity...");
      setTimeout(() => {
        const activeIdx = outline.findIndex(o => o.section_key === activeSectionKey);
        const nextIdx = activeIdx + 1;
        if (nextIdx < outline.length) {
          const nextSec = outline[nextIdx];
          const updatedOutline = outline.map((o, idx) => {
            if (o.section_key === activeSectionKey) return { ...o, status: "Completed" as const };
            if (idx === nextIdx) return { ...o, status: "Drafting" as const };
            return o;
          });
          setOutline(updatedOutline);
          setActiveSectionKey(nextSec.section_key);
          setDocumentText("");
          
          const welcomeMsg: SocraticMessage = {
            role: "assistant",
            content: `✓ Socratic Audit Passed for **${outline[activeIdx]?.section_title}**!\n\nLet's write Section: **${nextSec.section_title}**.\n\nGuidance hints: ${nextSec.guiding_hints}\n\nWhat specific challenges do you want to explore here?`,
            created_at: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, welcomeMsg]);
          setPlagiarismWarning(null);
          setDraftIntegrity(null);
        } else {
          setOutline(prev => prev.map(o => o.section_key === activeSectionKey ? { ...o, status: "Completed" as const } : o));
          const welcomeMsg: SocraticMessage = {
            role: "assistant",
            content: `Congratulations, Graduate Scholar! You have successfully completed active Socratic steering and drafted all sections of your Introduction!`,
            created_at: new Date().toISOString()
          };
          setChatHistory(prev => [...prev, welcomeMsg]);
        }
        setIsAuditing(false);
        setAuditMessage(null);
      }, 2000);
      return;
    }

    const activeSec = outline.find(o => o.section_key === activeSectionKey);
    if (!activeSec || activeSec.status !== "Drafting") {
      alert("Only the active 'Drafting' section can be submitted for Socratic Audit.");
      return;
    }

    setIsAuditing(true);
    setAuditMessage("Analyzing academic depth & integrity...");
    setPlagiarismWarning(null);

    try {
      // Autosave current draft explicitly
      await saveDraft(activeSectionKey, documentText);

      const res = await fetch(`${BACKEND_URL}/thesis/${thesisId}/outline/unlock-next`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Socratic Audit failed");
      }

      const data = await res.json();
      setAuditMessage("✓ Audit Passed! Next section unlocked.");
      
      // Update outline
      setOutline(data.outline);
      if (thesisId) fetchComments(thesisId);
      
      // Load next unlocked drafting section
      const nextActive = data.outline.find((o: ThesisOutline) => o.status === "Drafting");
      if (nextActive) {
        setActiveSectionKey(nextActive.section_key);
        setDocumentText(nextActive.draft_text || "");
      }
      
      // Append Socratic response inside conversation chat logs
      const welcomeMsg: SocraticMessage = {
        role: "assistant",
        content: data.message,
        created_at: new Date().toISOString()
      };
      setChatHistory(prev => [...prev, welcomeMsg]);
      
      // Clear warnings
      setPlagiarismWarning(null);
      setDraftIntegrity(null);

    } catch (err: any) {
      console.error(err);
      setPlagiarismWarning(`Socratic Audit Rejected: ${err.message}`);
    } finally {
      setIsAuditing(false);
      setAuditMessage(null);
    }
  };

  // Fetch fully compiled academic report and trigger printable modal overlay
  const handleOpenExportModal = async () => {
    if (!thesisId) {
      // Mock simulation fallback if no thesisId
      setIsExportLoading(true);
      setExportError(null);
      setTimeout(() => {
        const mockExport: ThesisExportReport = {
          title: thesisTitle || "Dynamic Multi-Agent Swarms for Academic Peer Verification",
          student_name: user?.full_name || "Graduate Researcher",
          student_email: user?.email || "student@veritas.ai",
          advisor_name: "Dr. Jane Advisor",
          topic_description: topicDescription || "Designing decentralized systems using WebMCP to automate research verification loops.",
          compiled_markdown: outline.map(o => `# ${o.section_title}\n\n${o.draft_text || "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec feugiat lectus."}`).join("\n\n"),
          references: [
            {
              id: 1,
              title: "Decentralized consensus in multi-agent routing systems",
              authors: "Dr. J. Doe",
              journal: "Journal of Autonomous Systems",
              year: 2024,
              doi: "10.1000/jas.2024.123",
              abstract: "This paper introduces a novel consensus mechanism for multi-agent systems.",
              url: "https://doi.org/10.1000/jas.2024.123",
              confidence_level: 9.8,
              citation_count: 12
            },
            {
              id: 2,
              title: "WebMCP: Bridging browser capabilities and LLM runtimes",
              authors: "DeepMind Team",
              journal: "AI Systems & Protocols",
              year: 2025,
              doi: "10.1000/aisp.2025.456",
              abstract: "A protocol for exposing client-side browser actions directly to AI agents.",
              url: "https://doi.org/10.1000/aisp.2025.456",
              confidence_level: 9.9,
              citation_count: 42
            }
          ],
          verification_sig: "VERITAS-AUTH-SIG-MOCK-HASH-CODE-999-XYZ",
          saves_count: 12,
          integrity_score: 98.4,
          interaction_count: 45,
          is_fully_completed: true,
          resolved_comments_count: comments.filter(c => c.is_resolved).length,
          total_comments_count: comments.length
        };
        setExportData(mockExport);
        setIsExportModalOpen(true);
        setIsExportLoading(false);
      }, 1000);
      return;
    }

    setIsExportLoading(true);
    setExportError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/thesis/${thesisId}/export`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        throw new Error("Failed to compile thesis export data.");
      }
      const data: ThesisExportReport = await res.json();
      setExportData(data);
      setIsExportModalOpen(true);
    } catch (err: any) {
      console.error(err);
      setExportError(err.message || "Failed to load academic portfolio export.");
      alert(err.message || "Failed to load academic portfolio export.");
    } finally {
      setIsExportLoading(false);
    }
  };

  // Stream-based Socratic mentor interaction
  const handleSendMessage = async (customMsg?: string) => {
    const msgToSend = customMsg || chatMessage;
    if (!msgToSend.trim?.() && !msgToSend) return;
    
    // Add user message to history
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
      // Trigger streaming Server-Sent Events (SSE) POST payload
      const res = await fetch(`${BACKEND_URL}/socratic/chat`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders() // Secure JWT auth header!
        },
        body: JSON.stringify({
          thesis_id: thesisId || 1,
          message: msgToSend,
          section: "Introduction",
          stream: true // Enable streaming!
        }),
      });

      if (!res.ok) throw new Error("Socratic streaming engine failure");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("Stream reader not supported");
      
      // Add empty assistant chat bubble to hold tokens as they are decoded
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
              const data = JSON.parse(dataStr.trim());
              
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
                console.log("Steering Logic Evaluator:", data.grading_feedback);
                if (data.grading_feedback.includes("Logical Gap Bypass")) {
                  setPlagiarismWarning("Pedagogical Intervention: Veritas AI blocks shortcuts. Try to express the arguments in your own words.");
                } else if (msgToSend.length > 50 && (msgToSend.toLowerCase().includes("easy") || msgToSend.toLowerCase().includes("simple"))) {
                  setPlagiarismWarning("Logical Gap: Student seeks shortcuts. Peer-review expert interjected.");
                } else {
                  setPlagiarismWarning(null);
                }
              }
            } catch (e) {
              // Parse error on incomplete text frames
            }
          }
        }
      }
      
    } catch (err) {
      // Mock Socratic engine fallback when backend is offline
      setTimeout(() => {
        const simulatedReply: SocraticMessage = {
          role: "assistant",
          content: `You've raised an interesting point about "${msgToSend.slice(0, 30)}...". However, an academic thesis requires justification. How do you intend to back this statement up? What specific evidence from the verified research papers (like Scholar & Academic, 2025) can you draw upon here?`,
          created_at: new Date().toISOString()
        };
        setChatHistory(prev => [...prev, simulatedReply]);
        setSuggestions([
          "Help me back this up with citations",
          "What are the research objectives for this introduction?",
          "Check my text for logical consistency"
        ]);
        
        if (msgToSend.length > 40 && (msgToSend.includes("write") || msgToSend.includes("answer"))) {
          setPlagiarismWarning("Pedagogical Intervention: Socratic guide encourages student authorship. Avoid passive output requests.");
        } else {
          setPlagiarismWarning(null);
        }
      }, 1500);
    } finally {
      setIsSending(false);
      setActiveSteeringMessage(null);
    }
  };

  const handleSuggestionClick = (suggestionText: string) => {
    handleSendMessage(suggestionText);
  };

  // Open modal for interactive paper deep-dives
  const handleOpenPaperModal = (paper: ResearchPaper) => {
    setSelectedPaper(paper);
    setIsPaperModalOpen(true);
  };

  // Caret cursor injection of standardized citation brackets
  const handleCiteSource = (paper: ResearchPaper) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;
    
    // Extract first author surname
    const authorSurname = paper.authors?.split(",")?.[0]?.split(" ")?.slice(-1)?.[0] || "Scholar";
    const citationString = ` [${authorSurname}, ${paper.year || 2025}] `;
    
    const newVal = currentVal.substring(0, start) + citationString + currentVal.substring(end);
    setDocumentText(newVal);
    
    // Focus back on editor textarea and set cursor position after injected text
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + citationString.length;
    }, 50);
    
    setIsPaperModalOpen(false);
    setSelectedPaper(null);
  };

  // Generate Supervisor Progress Signature
  const getDraftSignature = (sectionKey: string, text: string) => {
    let hash = 0;
    const combined = `${sectionKey}:${text}`;
    for (let i = 0; i < combined.length; i++) {
      hash = (hash << 5) - hash + combined.charCodeAt(i);
      hash |= 0;
    }
    return `VERITAS-AUTH-SIG-${Math.abs(hash).toString(16).toUpperCase()}-${new Date().toLocaleDateString()}`;
  };

  // Zero-dependency Client-side synthesis keywords overlap counter
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

  // Loading global auth states
  if (authLoading) {
    return (
      <div className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="glowing-orbit"></div>
      </div>
    );
  }

  // 🔐 AUTH GUARD STATE: Render gorgeous sign in page if not authenticated
  if (!isAuthenticated) {
    return (
      <main className="app-container" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="bg-glow bg-glow-left"></div>
        <div className="bg-glow bg-glow-right"></div>
        
        <form onSubmit={handleAuthSubmit} className="form-initialize glass" style={{ maxWidth: "450px" }}>
          <div className="brand-section" style={{ justifyContent: "center" }}>
            <div className="brand-logo">V</div>
            <h1 className="brand-title">Veritas AI</h1>
            <span className="brand-tag">Authentication Gate</span>
          </div>
          
          <p style={{ textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: "1.5" }}>
            Secure Single-Sign-On. Access your verified research portfolios, shadow synthesis engines, and Socratic dialogs.
          </p>

          {authError && (
            <div style={{ padding: "8px 12px", background: "rgba(255, 60, 80, 0.1)", border: "1px solid rgba(255, 60, 80, 0.3)", color: "var(--accent-red)", borderRadius: "var(--radius-sm)", fontSize: "0.8rem", fontWeight: 600 }}>
              {authError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email">Academic Email</label>
            <input
              id="auth-email"
              type="email"
              className="input-text"
              placeholder="e.g. scholar@university.edu"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth-name">Full Name</label>
            <input
              id="auth-name"
              type="text"
              className="input-text"
              placeholder="e.g. Dr. Jane Scholar"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: "14px", marginTop: "8px" }}>
            Authorize Secure Port
          </button>
        </form>
      </main>
    );
  }

  // 📝 AUTHENTICATED STATE: Render Dashboard
  return (
    <main className="app-container">
      {/* Background glowing gradients */}
      <div className="bg-glow bg-glow-left"></div>
      <div className="bg-glow bg-glow-right"></div>
      
      {/* STEP 0: Initial Form */}
      {step === 0 && (
        <form onSubmit={handleInitialize} className="form-initialize glass">
          <div className="brand-section" style={{ justifyContent: "center" }}>
            <div className="brand-logo">V</div>
            <h1 className="brand-title">Veritas AI</h1>
            <span className="brand-tag">SSO Verified</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", padding: "10px 16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Logged In As</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{user?.full_name} ({user?.email})</span>
            </div>
            <button type="button" className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem" }} onClick={logout}>
              Sign Out
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "10px" }}>
            <label htmlFor="title">Thesis Title</label>
            <input
              id="title"
              type="text"
              className="input-text"
              placeholder="e.g. The Role of Socratic AI in Graduate Education"
              value={thesisTitle}
              onChange={(e) => setThesisTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic Description & Context</label>
            <textarea
              id="topic"
              className="textarea-text"
              placeholder="Provide 2-3 sentences explaining your core research hypothesis and target goals..."
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ justifyContent: "center", padding: "14px" }}>
            Initialize Shadow Thesis
          </button>
        </form>
      )}

      {/* STEP 1: Loading Screen */}
      {step === 1 && (
        <div className="overlay-loading">
          <div className="loading-content">
            <div className="glowing-orbit"></div>
            <h2 className="loading-title text-gradient">Compiling Shadow Thesis</h2>
            <p className="loading-desc">
              Our multi-agent swarm is actively researching <strong>Semantic Scholar</strong>, 
              <strong>arXiv</strong>, and <strong>OpenAlex</strong>. We are synthesizing the ground-truth literature 
              and indexing verified citations (9.5+ confidence)...
            </p>
          </div>
        </div>
      )}

      {/* STEP 2: Main Workspace Split Screen */}
      {step === 2 && (
        <>
          {/* Left panel: Writing environment with Socratic Outline sidebar */}
          <section className="panel-editor" style={{ display: "flex", flexDirection: "row" }}>
            
            {/* Outline Panel Sidebar */}
            <aside className="outline-sidebar">
              <header className="outline-sidebar-header">
                <span>Outline Sections</span>
                <span style={{ fontSize: "0.65rem", background: "rgba(10, 200, 255, 0.08)", padding: "2px 6px", borderRadius: "10px", color: "var(--accent-cyan)", border: "1px solid rgba(10, 200, 255, 0.2)" }}>
                  NotebookLM Mode
                </span>
              </header>
              
              <div className="outline-items-list">
                {outline.map((sec) => {
                  const isActive = sec.section_key === activeSectionKey;
                  const isLocked = sec.status === "Locked";
                  const isCompleted = sec.status === "Completed";
                  const isDrafting = sec.status === "Drafting";
                  
                  return (
                    <div
                      key={sec.id}
                      onClick={() => handleSelectSection(sec)}
                      className={`outline-item-card ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isLocked ? "locked" : ""}`}
                    >
                      <div className="outline-card-title">
                        <span>{sec.section_title}</span>
                        <span style={{ fontSize: "0.7rem", fontWeight: 600 }}>
                          {isCompleted && <span style={{ color: "var(--accent-green)" }}>✓ Done</span>}
                          {isDrafting && <span style={{ color: "var(--accent-cyan)", animation: "pulse-glow 1.5s infinite" }}>● Drafting</span>}
                          {isLocked && <span style={{ color: "var(--text-muted)" }}>🔒 Locked</span>}
                        </span>
                      </div>
                      <p className="outline-card-hints">{sec.guiding_hints}</p>
                    </div>
                  );
                })}
              </div>

              {/* Faculty Socratic Feedback Section */}
              <div className="advisor-comments-section" style={{ borderTop: "1px solid var(--border-color)", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px", maxHeight: "280px", overflowY: "auto", background: "rgba(255,255,255,0.01)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    💬 Advisor Feedback
                  </span>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: hasUnresolvedComments ? "var(--accent-cyan)" : "var(--accent-green)", background: hasUnresolvedComments ? "rgba(10, 200, 255, 0.08)" : "rgba(16, 185, 129, 0.08)", padding: "2px 8px", borderRadius: "10px" }}>
                    {comments.filter(c => !c.is_resolved).length} Active
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {comments.length === 0 ? (
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontStyle: "italic", textAlign: "center", display: "block", padding: "8px 0" }}>
                      No supervisor annotations yet.
                    </span>
                  ) : (
                    comments.map((comment) => {
                      const section = outline.find(o => o.section_key === comment.section_key);
                      const isSecActive = comment.section_key === activeSectionKey;
                      return (
                        <div
                          key={comment.id}
                          style={{
                            padding: "10px",
                            borderRadius: "6px",
                            background: comment.is_resolved ? "rgba(16,185,129,0.02)" : isSecActive ? "rgba(10,200,255,0.04)" : "rgba(255,255,255,0.02)",
                            border: `1px solid ${comment.is_resolved ? "rgba(16,185,129,0.15)" : isSecActive ? "rgba(10,200,255,0.15)" : "rgba(255,255,255,0.06)"}`,
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              📌 {section ? section.section_title : comment.section_key}
                            </span>
                            {!comment.is_resolved ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveComment(comment.id);
                                }}
                                className="btn"
                                style={{
                                  padding: "2px 6px",
                                  fontSize: "0.62rem",
                                  background: "rgba(16,185,129,0.08)",
                                  border: "1px solid rgba(16,185,129,0.3)",
                                  color: "var(--accent-green)",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "3px",
                                  fontWeight: 600
                                }}
                                title="Resolve Advisor Socratic Guidance"
                              >
                                ✓ Resolve
                              </button>
                            ) : (
                              <span style={{ fontSize: "0.62rem", color: "var(--accent-green)", fontWeight: 700, display: "flex", alignItems: "center", gap: "2px" }}>
                                ✓ Resolved
                              </span>
                            )}
                          </div>

                          {comment.highlighted_quote && (
                            <span style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", fontStyle: "italic", borderLeft: "2px solid var(--accent-cyan)", paddingLeft: "6px", margin: "2px 0" }}>
                              "{comment.highlighted_quote}"
                            </span>
                          )}

                          <p style={{ fontSize: "0.72rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.3, textDecoration: comment.is_resolved ? "line-through" : "none", opacity: comment.is_resolved ? 0.5 : 1 }}>
                            {comment.comment_text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Socratic Audit Actions */}
              <div className="outline-sidebar-footer">
                {outline.length > 0 && outline.every(o => o.status === "Completed") ? (
                  hasUnresolvedComments ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <button
                        disabled={true}
                        className="btn"
                        style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.82rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(239, 68, 68, 0.25)", color: "rgba(255,255,255,0.3)", cursor: "not-allowed" }}
                      >
                        🔒 Export Gated by Advisor
                      </button>
                      <p style={{ fontSize: "0.68rem", color: "#f87171", textAlign: "center", margin: 0, fontWeight: 500 }}>
                        Resolve all outstanding supervisor comments to unlock signed portfolio exports.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleOpenExportModal}
                      disabled={isExportLoading}
                      className="btn btn-export-gold"
                      style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.82rem" }}
                    >
                      {isExportLoading ? "Compiling Portfolio..." : "✨ Export Signed Portfolio ✨"}
                    </button>
                  )
                ) : (
                  <>
                    <button
                      onClick={handleTriggerAudit}
                      disabled={isAuditing || outline.find(o => o.section_key === activeSectionKey)?.status !== "Drafting"}
                      className={`btn btn-primary ${documentText.trim().length >= 100 ? "btn-audit-pulse" : ""}`}
                      style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: "0.8rem" }}
                    >
                      {isAuditing ? "Auditing Synthesis..." : "Submit Section for Audit"}
                    </button>
                    {auditMessage && (
                      <p style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", marginTop: "8px", textAlign: "center", fontWeight: 500 }}>
                        {auditMessage}
                      </p>
                    )}
                  </>
                )}
              </div>
            </aside>

            {/* Document Editor Main Panel */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", position: "relative", overflow: "hidden" }}>
              
              {/* Padlocked Visual Card Overlay if Active Section is Locked */}
              {outline.find(o => o.section_key === activeSectionKey)?.status === "Locked" && (
                <div className="editor-locked-overlay">
                  <div className="overlay-lock-card glass">
                    <div className="lock-icon-container">🔒</div>
                    <h3 className="overlay-lock-title">Section Padlocked</h3>
                    <p className="overlay-lock-desc">
                      This segment of your Introduction is locked to ensure progressive writing integrity.
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>
                      Complete and pass the Socratic Audit for the preceding section to unlock drafting permissions.
                    </p>
                  </div>
                </div>
              )}

              {/* Read-Only Badge if Active Section is Completed */}
              {outline.find(o => o.section_key === activeSectionKey)?.status === "Completed" && (
                <div style={{
                  position: "absolute",
                  top: "84px",
                  right: "40px",
                  zIndex: 40,
                  background: "rgba(142, 255, 142, 0.08)",
                  border: "1px solid rgba(142, 255, 142, 0.25)",
                  color: "var(--accent-green)",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "20px",
                  boxShadow: "0 0 10px rgba(142,255,142,0.1)"
                }}>
                  Completed — Read Only
                </div>
              )}

              <header className="panel-header">
                <div className="brand-section">
                  <div className="brand-logo">V</div>
                  <h2 className="brand-title">Veritas</h2>
                  <span className="brand-tag">Workspace</span>
                </div>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  {draftIntegrity && outline.find(o => o.section_key === activeSectionKey)?.status === "Drafting" && (
                    <div 
                      title={draftIntegrity.plagiarism_risk === "Low" ? "Draft is original and clear." : `Similarity with "${draftIntegrity.matching_paper_title}"`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: draftIntegrity.plagiarism_risk === "High"
                          ? "rgba(255, 60, 80, 0.08)"
                          : draftIntegrity.plagiarism_risk === "Moderate"
                            ? "rgba(255, 160, 0, 0.08)"
                            : "rgba(10, 200, 255, 0.08)",
                        border: draftIntegrity.plagiarism_risk === "High"
                          ? "1px solid rgba(255, 60, 80, 0.2)"
                          : draftIntegrity.plagiarism_risk === "Moderate"
                            ? "1px solid rgba(255, 160, 0, 0.2)"
                            : "1px solid rgba(10, 200, 255, 0.2)",
                        borderRadius: "20px",
                        padding: "4px 10px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: draftIntegrity.plagiarism_risk === "High"
                          ? "var(--accent-red)"
                          : draftIntegrity.plagiarism_risk === "Moderate"
                            ? "var(--accent-amber)"
                            : "var(--accent-cyan)",
                        boxShadow: draftIntegrity.plagiarism_risk === "Low" ? "0 0 10px rgba(10, 200, 255, 0.1)" : "none",
                        transition: "all 0.3s ease"
                      }}
                    >
                      <div 
                        className="status-dot" 
                        style={{ 
                          width: "6px", 
                          height: "6px", 
                          backgroundColor: draftIntegrity.plagiarism_risk === "High"
                            ? "var(--accent-red)"
                            : draftIntegrity.plagiarism_risk === "Moderate"
                              ? "var(--accent-amber)"
                              : "var(--accent-cyan)",
                          animation: draftIntegrity.plagiarism_risk === "High" ? "pulse-glow 1s infinite" : "none"
                        }}
                      ></div>
                      Integrity: {((1 - draftIntegrity.highest_similarity) * 100).toFixed(0)}%
                    </div>
                  )}
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginRight: "8px" }}>
                    Hello, <strong>{user?.full_name?.split(" ")[0]}</strong>
                  </span>
                  <button className="btn btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem" }} onClick={logout}>
                    Sign Out
                  </button>
                </div>
              </header>

              <div className="workspace-content">
                <input 
                  type="text" 
                  className="thesis-title-input" 
                  value={thesisTitle}
                  onChange={(e) => setThesisTitle(e.target.value)}
                  disabled
                />
                
                {/* Active Section Title and Hints Overlay inside editor view */}
                <div style={{ background: "rgba(255,255,255,0.01)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Drafting Target: {outline.find(o => o.section_key === activeSectionKey)?.section_title}
                  </span>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                    {outline.find(o => o.section_key === activeSectionKey)?.guiding_hints}
                  </p>
                </div>

                <textarea
                  ref={editorRef} // Bind caret selector!
                  className="academic-editor"
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                  placeholder={`Write your draft for ${outline.find(o => o.section_key === activeSectionKey)?.section_title}...`}
                  disabled={outline.find(o => o.section_key === activeSectionKey)?.status !== "Drafting"}
                />
              </div>

              {/* Bottom Shelf Navigation Header */}
              <div style={{ display: "flex", borderTop: "1px solid var(--border-color)", background: "hsla(222, 28%, 4%, 0.6)", padding: "0 40px", height: "48px", flexShrink: 0, alignItems: "center", gap: "24px", zIndex: 10 }}>
                <button
                  onClick={() => setActiveFooterTab("references")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: activeFooterTab === "references" ? "var(--accent-cyan)" : "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    height: "100%",
                    borderBottom: activeFooterTab === "references" ? "2.5px solid var(--accent-cyan)" : "2px solid transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  Indexed Literature Shelf
                </button>
                <button
                  onClick={() => setActiveFooterTab("ledger")}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: activeFooterTab === "ledger" ? "var(--accent-cyan)" : "var(--text-muted)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    height: "100%",
                    borderBottom: activeFooterTab === "ledger" ? "2.5px solid var(--accent-cyan)" : "2px solid transparent",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  Authorship Progress Ledger
                  <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: "10px", background: "rgba(10,200,255,0.08)", color: "var(--accent-cyan)", border: "1px solid rgba(10,200,255,0.18)", fontWeight: 700 }}>
                    Verified
                  </span>
                </button>
              </div>

              {/* Bottom indexed references shelf */}
              <footer className="workspace-footer" style={{ maxHeight: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {activeFooterTab === "references" ? (
                  <>
                    {/* Claims Section */}
                    {verifiedClaims.length > 0 && (
                      <div>
                        <div className="footer-title">
                          <span>Socratic Fact-Verification Gating ({verifiedClaims.length})</span>
                          <span style={{ color: "var(--accent-violet)", fontSize: "0.7rem", fontWeight: 600 }}>Strict ≥2 DOIs Gate</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {verifiedClaims.map((claim) => {
                            const isVerified = claim.verification_status === "Verified";
                            return (
                              <div 
                                key={claim.id} 
                                onClick={() => {
                                  if (!isVerified) return;
                                  const firstDoi = claim.supporting_dois?.split(",")?.[0]?.trim();
                                  const matchingPaper = papers.find(p => p.doi?.toLowerCase() === firstDoi?.toLowerCase());
                                  if (matchingPaper) {
                                    handleOpenPaperModal(matchingPaper);
                                  } else {
                                    handleOpenPaperModal({
                                      id: claim.id,
                                      title: `Swarm Verified Research Insight`,
                                      authors: `Academic Swarm Network`,
                                      journal: `Veritas Verification Database`,
                                      year: 2025,
                                      doi: firstDoi,
                                      citation_count: claim.confidence_score,
                                      confidence_level: 9.8,
                                      url: firstDoi ? `https://doi.org/${firstDoi}` : undefined
                                    });
                                  }
                                }}
                                style={{
                                  padding: "12px 16px",
                                  borderRadius: "var(--radius-sm)",
                                  background: isVerified 
                                    ? "rgba(10, 200, 255, 0.03)" 
                                    : "rgba(255, 60, 80, 0.02)",
                                  border: isVerified 
                                    ? "1px solid rgba(10, 200, 255, 0.25)" 
                                    : "1px dashed rgba(255, 60, 80, 0.2)",
                                  boxShadow: isVerified ? "0 0 15px rgba(10, 200, 255, 0.05)" : "none",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  transition: "all 0.2s ease",
                                  cursor: isVerified ? "pointer" : "default" // Clickable claims!
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span style={{ 
                                    fontSize: "0.7rem", 
                                    fontWeight: 700, 
                                    color: isVerified ? "var(--accent-cyan)" : "var(--accent-red)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.05em"
                                  }}>
                                    {isVerified ? "✓ Swarm Verified — Deep-Dive Available" : "✗ Blocked — Insufficient Evidence"}
                                  </span>
                                  <span style={{ 
                                    fontSize: "0.68rem", 
                                    color: "var(--text-muted)",
                                    fontWeight: 600
                                  }}>
                                    Confidence: <strong style={{ color: isVerified ? "var(--accent-green)" : "var(--accent-amber)" }}>{claim.confidence_score} DOIs</strong>
                                  </span>
                                </div>
                                <p style={{ fontSize: "0.82rem", lineHeight: "1.4", color: isVerified ? "var(--text-primary)" : "var(--text-secondary)", opacity: isVerified ? 1 : 0.7 }}>
                                  "{claim.claim_text}"
                                </p>
                                {claim.supporting_dois && (
                                  <div style={{ 
                                    fontSize: "0.65rem", 
                                    color: "var(--text-muted)", 
                                    display: "flex", 
                                    alignItems: "center",
                                    gap: "6px", 
                                    overflowX: "auto", 
                                    scrollbarWidth: "none" 
                                  }}>
                                    <span style={{ fontWeight: 600 }}>Citations:</span>
                                    {claim.supporting_dois.split(",").map((doi, idx) => (
                                      <span 
                                        key={idx} 
                                        style={{ 
                                          background: "rgba(255,255,255,0.04)", 
                                          padding: "1px 6px", 
                                          borderRadius: "4px",
                                          border: "1px solid var(--border-color)",
                                          fontFamily: "monospace"
                                        }}
                                      >
                                        {doi.trim()}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Papers Section */}
                    <div>
                      <div className="footer-title">
                        <span>Verified Sources Indexed ({papers.length})</span>
                        <span style={{ color: "var(--accent-cyan)", fontSize: "0.7rem" }}>Linked by Swarm — Click to Deep-Dive</span>
                      </div>
                      <div className="paper-grid">
                        {papers.map((paper) => (
                          <div 
                            key={paper.id} 
                            className="paper-card"
                            onClick={() => handleOpenPaperModal(paper)}
                            style={{ cursor: "pointer" }} // Clickable cards!
                          >
                            <h4 className="paper-title" title={paper.title}>{paper.title}</h4>
                            <p className="paper-author">{paper.authors} ({paper.year})</p>
                            <div className="paper-meta">
                              <span className="paper-citation">Cit: {paper.citation_count}</span>
                              <span className="paper-confidence">★ {paper.confidence_level.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Progress Verification Ledger Tab */
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "8px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, textTransform: "uppercase", color: "white" }}>
                        Supervisor progress proof certificate
                      </h4>
                      <button
                        onClick={() => {
                          const sig = getDraftSignature(activeSectionKey, documentText);
                          navigator.clipboard.writeText(sig);
                          alert("Supervisor Proof Certificate copied to clipboard!");
                        }}
                        className="btn btn-secondary"
                        style={{ padding: "6px 12px", fontSize: "0.72rem" }}
                      >
                        Copy Verification Certificate
                      </button>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                      
                      {/* Originality Signatures */}
                      <div className="paper-card" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase" }}>
                          Cryptographic Hash Checksums
                        </span>
                        <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "8px", fontFamily: "monospace", wordBreak: "break-all", background: "rgba(0,0,0,0.2)", padding: "8px", borderRadius: "4px" }}>
                          {getDraftSignature(activeSectionKey, documentText)}
                        </p>
                        <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                          Generated locally. Updates on drafts save.
                        </span>
                      </div>

                      {/* Synthesis Progress */}
                      <div className="paper-card" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-violet)", textTransform: "uppercase" }}>
                          Claim Keyword Syntheses
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
                          <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
                            {getSynthesizedClaimsCount()}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            / {verifiedClaims.filter(c => c.verification_status === "Verified").length} verified claims integrated
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
                          <div style={{
                            width: `${(verifiedClaims.filter(c => c.verification_status === "Verified").length > 0) ? (getSynthesizedClaimsCount() / verifiedClaims.filter(c => c.verification_status === "Verified").length * 100) : 0}%`,
                            height: "100%",
                            background: "var(--grad-primary)",
                            transition: "all 0.3s ease"
                          }}></div>
                        </div>
                      </div>

                      {/* Socratic Audits Count */}
                      <div className="paper-card" style={{ padding: "16px", background: "rgba(255,255,255,0.01)" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--accent-green)", textTransform: "uppercase" }}>
                          Milestones Locked / Unlocked
                        </span>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "12px" }}>
                          {outline.map((o) => (
                            <div key={o.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem" }}>
                              <span style={{ color: "var(--text-secondary)" }}>{o.section_title}</span>
                              <span style={{ fontWeight: 600, color: o.status === "Completed" ? "var(--accent-green)" : o.status === "Drafting" ? "var(--accent-cyan)" : "var(--text-muted)" }}>
                                {o.status === "Completed" ? "✓ Completed" : o.status === "Drafting" ? "● Active Drafting" : "🔒 Locked"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* B2B Supervisor Feedback Gate Card */}
                      <div className="paper-card" style={{ padding: "16px", background: "rgba(255,255,255,0.01)", border: hasUnresolvedComments ? "1px solid rgba(239,68,68,0.15)" : "1px solid rgba(16,185,129,0.15)" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: hasUnresolvedComments ? "var(--accent-cyan)" : "var(--accent-green)", textTransform: "uppercase" }}>
                          Faculty Gating & Resolution
                        </span>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "12px" }}>
                          <span style={{ fontSize: "2rem", fontWeight: 800, color: "white" }}>
                            {comments.filter(c => c.is_resolved).length}
                          </span>
                          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            / {comments.length} supervisor comments resolved
                          </span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", marginTop: "12px", overflow: "hidden" }}>
                          <div style={{
                            width: `${(comments.length > 0) ? (comments.filter(c => c.is_resolved).length / comments.length * 100) : 100}%`,
                            height: "100%",
                            background: hasUnresolvedComments ? "linear-gradient(135deg, var(--accent-cyan), #0284c7)" : "linear-gradient(135deg, var(--accent-green), #059669)",
                            transition: "all 0.3s ease"
                          }}></div>
                        </div>
                        <p style={{ fontSize: "0.68rem", color: hasUnresolvedComments ? "var(--text-muted)" : "var(--accent-green)", marginTop: "10px", margin: "10px 0 0 0" }}>
                          {hasUnresolvedComments 
                            ? "⚠️ Outstanding advisor comments must be resolved before final graduation thesis export." 
                            : "✓ All faculty Socratic comments resolved. Ready for thesis compilation."
                          }
                        </p>
                      </div>

                    </div>
                  </div>
                )}
              </footer>
            </div>
          </section>

          {/* Right panel: Socratic mentor */}
          <section className="panel-mentor">
            <header className="panel-header">
              <h3 className="brand-title">Socratic Mentor</h3>
              <div className="status-badge status-shadow-active">
                <div className="status-dot"></div>
                Shadow Agent Active
              </div>
            </header>

            {/* Chat Thread */}
            <div className="chat-thread">
              {chatHistory.map((msg, index) => (
                <div 
                  key={index} 
                  className={`chat-bubble-container ${msg.role === "user" ? "chat-bubble-container-user" : ""}`}
                >
                  <div className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"}`}>
                    {msg.content.split("\n\n").map((para, i) => (
                      <p key={i} style={{ marginBottom: i < msg.content.split("\n\n").length - 1 ? "12px" : 0 }}>
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="chat-bubble-container">
                  <div className="chat-bubble chat-bubble-assistant" style={{ opacity: 0.6 }}>
                    Thinking, evaluating draft against Shadow Thesis...
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Plagiarism/Logic Alert banner */}
            {plagiarismWarning && (
              <div style={{
                margin: "0 24px 12px",
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(255, 60, 80, 0.1)",
                border: "1px solid rgba(255, 60, 80, 0.3)",
                color: "var(--accent-red)",
                fontSize: "0.78rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
                boxShadow: "0 4px 10px rgba(255,60,80,0.1)"
              }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "var(--accent-red)" }}></div>
                {plagiarismWarning}
              </div>
            )}

            {/* Steering message banner */}
            {activeSteeringMessage && (
              <div style={{
                margin: "0 24px 12px",
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                background: "rgba(30, 200, 255, 0.05)",
                border: "1px solid rgba(30, 200, 255, 0.15)",
                color: "var(--accent-cyan)",
                fontSize: "0.72rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 500
              }}>
                <div className="status-dot" style={{ backgroundColor: "var(--accent-cyan)", animation: "pulse-glow 1.2s infinite" }}></div>
                {activeSteeringMessage}
              </div>
            )}

            {/* Suggestions Box */}
            <div className="suggestions-box">
              {getDynamicSuggestions().map((suggestion, index) => (
                <button
                  key={index}
                  className="suggestion-pill"
                  onClick={() => handleSuggestionClick(suggestion)}
                  disabled={isSending}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="chat-input-bar">
              <input
                type="text"
                className="chat-input"
                placeholder="Ask Mentor a question or request draft evaluation..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isSending}
              />
              <button 
                className="btn btn-primary" 
                onClick={() => handleSendMessage()}
                disabled={isSending}
              >
                Send
              </button>
            </div>
          </section>
        </>
      )}

      {/* 🔮 Citation Deep-Dive Glassmorphic Modal */}
      {isPaperModalOpen && selectedPaper && (
        <div className="editor-locked-overlay" style={{ zIndex: 200 }}>
          <div className="overlay-lock-card glass" style={{ maxWidth: "520px", textAlign: "left", alignItems: "flex-start", background: "rgba(10, 12, 22, 0.95)", border: "1px solid var(--border-color)", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--accent-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Verified Source Deep-Dive
              </span>
              <button 
                onClick={() => { setIsPaperModalOpen(false); setSelectedPaper(null); }} 
                className="btn btn-secondary" 
                style={{ padding: "4px 8px", fontSize: "0.7rem" }}
              >
                ✕ Close
              </button>
            </div>
            
            <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "14px", width: "100%" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "white", lineHeight: "1.4" }}>
                {selectedPaper.title}
              </h3>
              
              <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>
                <strong>Authors:</strong> {selectedPaper.authors || "Academic Swarm"}
              </p>
              
              <div style={{ display: "flex", gap: "16px", fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.02)", padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
                <span><strong>Year:</strong> {selectedPaper.year || 2025}</span>
                <span><strong>Citations:</strong> <span style={{ color: "var(--accent-cyan)" }}>{selectedPaper.citation_count}</span></span>
                <span><strong>Confidence:</strong> <span style={{ color: "var(--accent-green)" }}>★ {selectedPaper.confidence_level.toFixed(1)}</span></span>
              </div>
              
              {selectedPaper.doi && (
                <p style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--accent-violet)", margin: 0 }}>
                  <strong>DOI:</strong> {selectedPaper.doi}
                </p>
              )}

              {selectedPaper.abstract && (
                <div>
                  <strong style={{ fontSize: "0.78rem", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>
                    Source Abstract Takeaway & Takeaways
                  </strong>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-primary)", lineHeight: "1.5", background: "rgba(10,200,255,0.02)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(10,200,255,0.15)", margin: 0 }}>
                    {selectedPaper.abstract}
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", width: "100%", marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                <button 
                  onClick={() => handleCiteSource(selectedPaper)}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center", fontSize: "0.8rem", padding: "12px" }}
                >
                  Cite Source at Cursor
                </button>
                {selectedPaper.url && (
                  <a 
                    href={selectedPaper.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="btn btn-secondary"
                    style={{ flex: 1, justifyContent: "center", fontSize: "0.8rem", padding: "12px", textDecoration: "none", color: "white", display: "inline-flex", alignItems: "center" }}
                  >
                    View Paper ↗
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 Printable Thesis Portfolio Full-Screen Overlay Modal */}
      {isExportModalOpen && exportData && (
        <div className="export-modal-overlay">
          <header className="export-modal-header">
            <h2 className="export-header-title">
              🎓 Verified Thesis Portfolio Workspace
            </h2>
            <div className="export-actions">
              <button 
                onClick={() => { window.print(); }} 
                className="btn btn-primary"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "white", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                🖨️ Print / Save PDF
              </button>
              <button 
                onClick={() => { setIsExportModalOpen(false); }} 
                className="btn btn-secondary"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}
              >
                ✕ Close Workspace
              </button>
            </div>
          </header>

          <div className="print-sheet">
            {/* Cover Sheet */}
            <div className="academic-cover">
              <div className="institution-title">Veritas AI Graduate Thesis Portal</div>
              <h1 className="thesis-export-title">{exportData.title}</h1>
              
              <div className="cover-details">
                <div className="detail-row">Candidate: <span>{exportData.student_name}</span></div>
                <div className="detail-row">University Cohort ID: <span>{exportData.student_email}</span></div>
                {exportData.advisor_name && (
                  <div className="detail-row">Faculty Mentor: <span>{exportData.advisor_name}</span></div>
                )}
                <div className="detail-row">Topic Area: <span>{exportData.topic_description}</span></div>
                <div className="detail-row">Completion Timestamp: <span>{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
              </div>

              {/* Cryptographic Verified Learning Seal */}
              <div className="ledger-seal-container" style={{ position: "relative" }}>
                <div className="ledger-seal">
                  <div className="ledger-seal-title">
                    🛡️ Authorship Ledger Authenticity Seal
                  </div>
                  <div className="ledger-seal-hash">
                    {exportData.verification_sig}
                  </div>
                  <div className="ledger-metrics-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                    <div className="ledger-metric-item">
                      <span className="ledger-metric-val">{exportData.saves_count}</span>
                      <span className="ledger-metric-label">Autosaves Audited</span>
                    </div>
                    <div className="ledger-metric-item">
                      <span className="ledger-metric-val">{exportData.integrity_score.toFixed(1)}%</span>
                      <span className="ledger-metric-label">Originality index</span>
                    </div>
                    <div className="ledger-metric-item">
                      <span className="ledger-metric-val">{exportData.interaction_count}</span>
                      <span className="ledger-metric-label">Socratic dialogs</span>
                    </div>
                    <div className="ledger-metric-item">
                      <span className="ledger-metric-val">{exportData.resolved_comments_count} / {exportData.total_comments_count}</span>
                      <span className="ledger-metric-label">Advisor Annotations</span>
                    </div>
                  </div>
                </div>

                {/* Rotating ink-stamp verification seal */}
                {exportData.total_comments_count > 0 && exportData.resolved_comments_count === exportData.total_comments_count && (
                  <div className="veritas-seal-stamp" style={{
                    position: "absolute",
                    bottom: "-15px",
                    right: "-15px",
                    border: "3px double #10b981",
                    borderRadius: "50%",
                    width: "90px",
                    height: "90px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    color: "#10b981",
                    transform: "rotate(-15deg)",
                    fontWeight: 800,
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 1.1,
                    letterSpacing: "0.05em",
                    background: "rgba(16,185,129,0.05)",
                    boxShadow: "0 0 0 3px rgba(16,185,129,0.05)",
                    fontFamily: "monospace",
                    zIndex: 10
                  }}>
                    <span>✓ Veritas</span>
                    <span>Approved</span>
                    <span style={{ fontSize: "0.45rem", marginTop: "2px" }}>Seal #11</span>
                  </div>
                )}
              </div>
            </div>

            {/* Compiled Chapters */}
            <div className="export-content-chapters">
              {outline.map((sec, idx) => (
                <div className="export-chapter-block" key={sec.id || idx}>
                  <h2 className="export-chapter-title">
                    Chapter {idx + 1}: {sec.section_title}
                  </h2>
                  <div className="export-chapter-text">
                    {sec.draft_text || "This chapter has not been drafted yet."}
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Swarmed Bibliography */}
            {exportData.references && exportData.references.length > 0 && (
              <div className="export-bibliography">
                <h2 className="bib-title">References & Bibliography</h2>
                <ol className="bib-list">
                  {exportData.references.map((paper, idx) => (
                    <li className="bib-item" key={paper.id || idx}>
                      <strong>{paper.authors || "Academic Swarm"}</strong> ({paper.year || 2025}). 
                      {" "}"{paper.title}". 
                      {paper.journal && <em> {paper.journal}</em>}.
                      {paper.doi && <span className="bib-doi">DOI: {paper.doi}</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
