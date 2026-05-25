import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_exporter_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
except ImportError as e:
    print(f"[Verification Exporter Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_thesis_exporter_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 10 THESIS EXPORTER TEST SUITE   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed Student & Advisor Users
    # ----------------------------------------------------
    print("[Step 1] Seeding student and advisor users...")
    advisor = models.User(
        email="advisor@veritas.ai",
        hashed_password="secure_password",
        full_name="Dr. Jane Advisor",
        is_supervisor=True
    )
    db.add(advisor)
    
    student = models.User(
        email="student@veritas.ai",
        hashed_password="secure_password",
        full_name="Alice Student",
        is_supervisor=False
    )
    db.add(student)
    db.commit()
    
    # Authenticate Alice Student (via standard mock authentication headers)
    headers_student = {"Authorization": "Bearer mock_user_student"}
    
    # ----------------------------------------------------
    # STEP 2: Create Alice's Thesis & Research Papers
    # ----------------------------------------------------
    print("[Step 2] Seeding Alice's thesis, outline segments, and research references...")
    thesis = models.Thesis(
        user_id=student.id,
        title="Dynamic Multi-Agent Swarms for Academic Peer Verification",
        topic_description="Designing decentralized systems using WebMCP to automate research verification loops.",
        supervisor_email="advisor@veritas.ai",
        status="Drafting"
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Seed 4 Outline segments, representing the complete 10-week educational outline gates
    sections = [
        ("Introduction", "intro", "Introduction chapter draft focusing on academic integrity problems."),
        ("Literature Review", "lit_review", "Extensive literature analysis mapping WebMCP and decentralized agent architectures."),
        ("Methodology", "method", "Detailed implementation steps of the swarmed database and consensus protocols."),
        ("Evaluation & Findings", "findings", "Evaluating false-positive rates and latency bounds of verification pipelines.")
    ]
    
    for i, (title, key, draft_content) in enumerate(sections):
        outline = models.ThesisOutline(
            thesis_id=thesis.id,
            section_title=title,
            section_key=key,
            draft_text=draft_content,
            status="Completed"  # All marked as Completed to trigger fully unlocked print previews!
        )
        db.add(outline)
    db.commit()
    
    # Seed Research papers referenced inside drafts
    paper1 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Decentralized consensus in multi-agent routing systems",
        authors="Dr. J. Doe",
        journal="Journal of Autonomous Systems",
        year=2024,
        doi="10.1000/jas.2024.123",
        abstract="This paper introduces a novel consensus mechanism for multi-agent systems.",
        url="https://doi.org/10.1000/jas.2024.123",
        confidence_level=9.8,
        citation_count=12
    )
    
    paper2 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="WebMCP: Bridging browser capabilities and LLM runtimes",
        authors="DeepMind Team",
        journal="AI Systems & Protocols",
        year=2025,
        doi="10.1000/aisp.2025.456",
        abstract="A protocol for exposing client-side browser actions directly to AI agents.",
        url="https://doi.org/10.1000/aisp.2025.456",
        confidence_level=9.9,
        citation_count=42
    )
    db.add(paper1)
    db.add(paper2)
    db.commit()
    
    # Write Socratic Mentoring dialogue bubbles
    dialog_user = models.SocraticDialog(
        thesis_id=thesis.id,
        section="Introduction",
        role="user",
        content="I have integrated decentralized consensus strategies."
    )
    dialog_ai = models.SocraticDialog(
        thesis_id=thesis.id,
        section="Introduction",
        role="assistant",
        content="Excellent. How do you mitigate double-validation loops in the methodology?"
    )
    db.add(dialog_user)
    db.add(dialog_ai)
    db.commit()
    
    # Seed AuthorshipLedger timeline entries (autosaves and section unlocks)
    from app.services.ledger_service import log_ledger_entry
    log_ledger_entry(
        thesis_id=thesis.id,
        section_key="intro",
        action="save_draft",
        draft_text=sections[0][2],
        plagiarism_index=0.08, # 8% similarity
        synthesis_count=2,
        db=db
    )
    
    log_ledger_entry(
        thesis_id=thesis.id,
        section_key="lit_review",
        action="unlock_section",
        draft_text=sections[1][2],
        plagiarism_index=0.05, # 5% similarity
        synthesis_count=3,
        db=db
    )
    
    print("  ✓ Alice's thesis fully seeded with complete chapters and academic papers.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Invoke GET /thesis/{id}/export endpoint
    # ----------------------------------------------------
    print("[Step 3] Fetching Alice's completed thesis export compilation...")
    res = client.get(
        f"/api/v1/thesis/{thesis.id}/export",
        headers=headers_student
    )
    assert res.status_code == 200
    
    export_data = res.json()
    
    # Assert cover sheet properties
    assert export_data["title"] == "Dynamic Multi-Agent Swarms for Academic Peer Verification"
    assert export_data["student_name"] == "Alice Student"
    assert export_data["student_email"] == "student@veritas.ai"
    assert export_data["advisor_name"] == "Dr. Jane Advisor"
    assert "WebMCP" in export_data["topic_description"]
    
    # Assert compiled Markdown chapters
    assert "# Introduction" in export_data["compiled_markdown"]
    assert "Evaluating false-positive rates" in export_data["compiled_markdown"]
    
    # Assert swarmed bibliography
    assert len(export_data["references"]) == 2
    assert export_data["references"][0]["title"] == "Decentralized consensus in multi-agent routing systems"
    
    # Assert Authorship Ledger authenticity parameters
    assert export_data["saves_count"] == 1
    assert export_data["integrity_score"] == 92.0  # 100 - (0.08 * 100)
    assert export_data["interaction_count"] == 2
    assert export_data["is_fully_completed"] is True
    assert export_data["verification_sig"].startswith("VERITAS-AUTH-SIG-")
    
    print("  ✓ Exporter API Payload assertions passed! (All fields match specifications)")
    print("-" * 60)
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_exporter_test.db"):
        os.remove("./veritas_exporter_test.db")
        
    print("=" * 60)
    print("   ALL VERITAS AI EXPORTER SUITE TESTS COMPLETED SUCCESSFULLY!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_thesis_exporter_suite()
