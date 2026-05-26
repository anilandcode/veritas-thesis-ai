"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";

export default function NewProjectWizardPage() {
  const { getAuthHeaders } = useAuth();
  const router = useRouter();
  
  // Setup Wizard Steps: 1: Topic, 2: Question, 3: Sources, 4: Workspace
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [title, setTitle] = useState("");
  const [topicDescription, setTopicDescription] = useState("");
  const [subjectArea, setSubjectArea] = useState("Graduate Seminar");
  const [initialQuestion, setInitialQuestion] = useState("");
  const [deadline, setDeadline] = useState("");
  const [citationStyle, setCitationStyle] = useState("APA 7th Edition");
  const [selectedDatabases, setSelectedDatabases] = useState<string[]>([
    "Semantic Scholar",
    "arXiv",
    "OpenAlex"
  ]);

  const handleToggleDb = (db: string) => {
    setSelectedDatabases(prev => 
      prev.includes(db) ? prev.filter(d => d !== db) : [...prev, db]
    );
  };

  const handleNextStep = () => {
    setError(null);
    if (step === 1 && (!title.trim() || !topicDescription.trim())) {
      setError("Please fill in the project title and topic description.");
      return;
    }
    if (step === 2 && !initialQuestion.trim()) {
      setError("Please clarify your initial research question.");
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const res = await fetch(`${BACKEND_URL}/thesis/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title,
          topic_description: `${topicDescription}\nSubject Area: ${subjectArea}\nInitial Question: ${initialQuestion}\nCitation Style: ${citationStyle}\nDeadline: ${deadline}`
        })
      });

      if (!res.ok) {
        throw new Error("Failed to create the research project on the server.");
      }

      const data = await res.json();
      localStorage.setItem("veritas_active_thesis_id", data.id.toString());
      
      // Redirect to the newly created project overview dashboard, triggering the progressive search loader
      router.push(`/app/projects/${data.id}?loading=true`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "700px", margin: "0 auto", width: "100%", overflowY: "auto", height: "100%" }}>
      
      {/* Wizard Header */}
      <div style={{ marginBottom: "32px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
        <span style={{ fontSize: "12px", color: "var(--accent-blue)", fontWeight: 600, textTransform: "uppercase" }}>Setup Wizard</span>
        <h1 style={{ fontSize: "28px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>Start a research project</h1>
      </div>

      {/* Progress Stepper */}
      <div style={{ display: "flex", justifyContent: "space-between", background: "var(--bg-card)", padding: "16px 24px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", marginBottom: "32px" }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", width: "100%", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: step >= 1 ? "var(--success)" : "var(--text-muted)" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              {step > 1 ? "✓" : "1"}
            </span>
            <span style={{ fontSize: "13px", fontWeight: step === 1 ? 600 : 500 }}>Topic</span>
          </div>
          
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)", margin: "0 10px" }}></div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: step >= 2 ? (step > 2 ? "var(--success)" : "var(--accent-blue)") : "var(--text-muted)" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              {step > 2 ? "✓" : "2"}
            </span>
            <span style={{ fontSize: "13px", fontWeight: step === 2 ? 600 : 500 }}>Question</span>
          </div>
          
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)", margin: "0 10px" }}></div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: step >= 3 ? (step > 3 ? "var(--success)" : "var(--accent-blue)") : "var(--text-muted)" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              {step > 3 ? "✓" : "3"}
            </span>
            <span style={{ fontSize: "13px", fontWeight: step === 3 ? 600 : 500 }}>Sources</span>
          </div>
          
          <div style={{ flex: 1, height: "1px", background: "var(--border-color)", margin: "0 10px" }}></div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: step === 4 ? "var(--accent-blue)" : "var(--text-muted)" }}>
            <span style={{ width: "20px", height: "20px", borderRadius: "50%", border: "1.5px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>
              4
            </span>
            <span style={{ fontSize: "13px", fontWeight: step === 4 ? 600 : 500 }}>Workspace</span>
          </div>

        </div>
      </div>

      {error && (
        <div className="badge badge-evidence-gap" style={{ width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)", marginBottom: "20px", display: "block", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {/* STEP 1: Topic */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="w-title">Working Title</label>
            <input
              id="w-title"
              type="text"
              className="text-field"
              placeholder="e.g. Dynamic Multi-Agent Routing in Graduate Pedagogy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="w-desc">Subject Area & Degree Level</label>
            <select
              id="w-desc"
              className="text-field"
              value={subjectArea}
              onChange={(e) => setSubjectArea(e.target.value)}
              style={{ background: "var(--bg-card)" }}
            >
              <option value="Graduate Seminar">Graduate Seminar (Masters/M.Phil)</option>
              <option value="Doctoral Dissertation">Doctoral Dissertation (Ph.D.)</option>
              <option value="Undergraduate Honors">Undergraduate Honors Thesis</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="w-topic">Research Context & Problem Statement</label>
            <textarea
              id="w-topic"
              className="text-area"
              placeholder="Provide 2-3 sentences explaining your core research hypothesis and target objectives..."
              value={topicDescription}
              onChange={(e) => setTopicDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button type="button" className="btn btn-primary" onClick={handleNextStep}>
              Next: Define Question
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Question */}
      {step === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label" htmlFor="w-question">Primary Research Question</label>
            <textarea
              id="w-question"
              className="text-area"
              placeholder="Formulate a highly focused, open-ended question that guides your literature map (e.g. How does Socratic active outline gating affect student retention in writing seminar cohorts?)"
              value={initialQuestion}
              onChange={(e) => setInitialQuestion(e.target.value)}
              required
            />
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", marginTop: "4px" }}>
              Veritas Socratic Mentor will review this question and suggest academic search queries.
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNextStep}>
              Next: Select Sources
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Sources */}
      {step === 3 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">Preferred Literature Databases</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
              {[
                { name: "Semantic Scholar", desc: "For general computer science, AI, and social sciences." },
                { name: "arXiv", desc: "For physics, math, computer science, and engineering preprints." },
                { name: "OpenAlex", desc: "Comprehensive global registry of research papers and journals." }
              ].map(db => (
                <div 
                  key={db.name}
                  onClick={() => handleToggleDb(db.name)}
                  style={{
                    padding: "16px",
                    borderRadius: "8px",
                    border: `1px solid ${selectedDatabases.includes(db.name) ? "var(--accent-blue)" : "var(--border-color)"}`,
                    background: selectedDatabases.includes(db.name) ? "var(--bg-blue-soft)" : "var(--bg-card)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "14px", display: "block" }}>{db.name}</span>
                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>{db.desc}</span>
                  </div>
                  <span style={{ fontSize: "16px", color: "var(--accent-blue)" }}>
                    {selectedDatabases.includes(db.name) ? "☑" : "☐"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={handleNextStep}>
              Next: Configure Workspace
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Workspace */}
      {step === 4 && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="w-style">Preferred Citation Style</label>
              <select
                id="w-style"
                className="text-field"
                value={citationStyle}
                onChange={(e) => setCitationStyle(e.target.value)}
                style={{ background: "var(--bg-card)" }}
              >
                <option value="APA 7th Edition">APA 7th Edition</option>
                <option value="Harvard Format">Harvard Format</option>
                <option value="IEEE Standards">IEEE Standards</option>
                <option value="Chicago Style 17th">Chicago Style 17th</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="w-date">Target Submission Deadline</label>
              <input
                id="w-date"
                type="date"
                className="text-field"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div style={{ background: "var(--bg-subtle)", padding: "16px", border: "1px solid var(--border-color)", borderRadius: "8px", marginTop: "8px" }}>
            <span style={{ fontWeight: 600, fontSize: "13px", display: "block" }}>Pedagogical Integrity Policy</span>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "4px" }}>
              Veritas acts as a Socratic writing coach. When you finalize this project, Veritas will search literature databases to compile an **Evidence Map** in the background, but it will never write text on your behalf.
            </p>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px" }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(3)} disabled={isSubmitting}>
              Back
            </button>
            <button type="submit" className="btn btn-accent" disabled={isSubmitting}>
              {isSubmitting ? "Creating workspace..." : "Create project and refine question"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
