import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_dashboard_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
except ImportError as e:
    print(f"[Verification Dashboard Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_supervisor_dashboard_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 9 B2B SUPERVISOR DASHBOARD TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed Supervisor User
    # ----------------------------------------------------
    print("[Step 1] Seeding cohort supervisor user...")
    supervisor = models.User(
        email="advisor@veritas.ai",
        hashed_password="secure_password",
        full_name="Dr. Jane Advisor",
        is_supervisor=True
    )
    db.add(supervisor)
    db.commit()
    
    # Seed unauthorized user
    regular_student = models.User(
        email="regular_student@veritas.ai",
        hashed_password="secure_password",
        is_supervisor=False
    )
    db.add(regular_student)
    db.commit()
    
    print("  ✓ Supervisor seeded successfully (advisor@veritas.ai).")
    print("-" * 60)
    
    headers_supervisor = {"Authorization": "Bearer mock_user_advisor"}
    headers_student = {"Authorization": "Bearer mock_user_regular_student@veritas.ai"}
    
    # ----------------------------------------------------
    # STEP 2: Validate Guard Restrictions (Unauthorized access)
    # ----------------------------------------------------
    print("[Step 2] Auditing authorization guard restrictions...")
    
    # Student tries to invite student
    res_student_invite = client.post(
        "/api/v1/thesis/supervisor/invite",
        json={
            "student_email": "newbie@university.edu",
            "thesis_title": "Hijacked Thesis Title",
            "topic_description": "Hijacked Topic"
        },
        headers=headers_student
    )
    assert res_student_invite.status_code == 403
    
    # Student tries to view supervisor cohort
    res_student_cohort = client.get(
        "/api/v1/thesis/supervisor/students",
        headers=headers_student
    )
    assert res_student_cohort.status_code == 403
    
    print("  ✓ Security Guards: Successfully blocked student access to supervisor routers.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Validate B2B Student Invitation & Seeding
    # ----------------------------------------------------
    print("[Step 3] Testing supervisor cohort student invites...")
    
    res_invite = client.post(
        "/api/v1/thesis/supervisor/invite",
        json={
            "student_email": "scholar_student@university.edu",
            "thesis_title": "B2B Educational SaaS dashboards and Swarmed AI verification",
            "topic_description": "Building next-generation cohort monitors for university thesis steering."
        },
        headers=headers_supervisor
    )
    assert res_invite.status_code == 200
    
    invite_report = res_invite.json()
    assert invite_report["student_email"] == "scholar_student@university.edu"
    assert invite_report["status"] == "Generating Shadow"
    
    # Check database and verify the newly invited student user exists
    invited_student = db.query(models.User).filter(
        models.User.email == "scholar_student@university.edu"
    ).first()
    assert invited_student is not None
    assert invited_student.is_supervisor is False
    
    # Check if student thesis has supervisor_email mapped
    student_thesis = db.query(models.Thesis).filter(
        models.Thesis.user_id == invited_student.id
    ).first()
    assert student_thesis is not None
    assert student_thesis.supervisor_email == "advisor@veritas.ai"
    
    print("  ✓ Student Invite Hook: Student user created and shadow thesis generation dispatched.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Write ledger and dialog logs to seed analytics
    # ----------------------------------------------------
    print("[Step 4] Pre-seeding dialogue logs and draft verification ledger logs...")
    
    # Simulate outline pre-seeding (normally done in background swarm)
    outline_context = models.ThesisOutline(
        thesis_id=student_thesis.id,
        section_title="Context & Relevance",
        section_key="context",
        status="Drafting",
        draft_text="Drafting B2B Educational SaaS dashboards and Socratic AI verifications inside cohort pools."
    )
    db.add(outline_context)
    db.commit()
    
    # Seed visual paper inside database
    paper = models.ResearchPaper(
        thesis_id=student_thesis.id,
        title="B2B Steering and Swarmed verifications",
        doi="10.1000/arxiv.b2b.cohorts",
        confidence_level=9.5,
        citation_count=4
    )
    db.add(paper)
    db.commit()
    
    # Write Socratic Dialogue entries to verify bubble counts
    dialog_1 = models.SocraticDialog(
        thesis_id=student_thesis.id,
        section="Introduction",
        role="user",
        content="Hello mentor"
    )
    dialog_2 = models.SocraticDialog(
        thesis_id=student_thesis.id,
        section="Introduction",
        role="assistant",
        content="I am here to coach your writing. What findings do you want to highlight?"
    )
    db.add(dialog_1)
    db.add(dialog_2)
    db.commit()
    
    # Write AuthorshipLedger logs (save_draft and unlock_section)
    from app.services.ledger_service import log_ledger_entry
    log_ledger_entry(
        thesis_id=student_thesis.id,
        section_key="context",
        action="save_draft",
        draft_text=outline_context.draft_text,
        plagiarism_index=0.12,  # 12% similarity
        synthesis_count=3,
        db=db
    )
    
    log_ledger_entry(
        thesis_id=student_thesis.id,
        section_key="context",
        action="unlock_section",
        draft_text=outline_context.draft_text,
        plagiarism_index=0.10,  # 10% similarity
        synthesis_count=4,
        db=db
    )
    
    # Seed verified claims to verify claim percentage counts
    models_claim = models.VerifiedClaim(
        thesis_id=student_thesis.id,
        section="Introduction",
        claim_text="B2B dashboards steer critical writing.",
        supporting_dois="10.1000/arxiv.b2b.cohorts",
        verification_status="Verified"
    )
    db.add(models_claim)
    db.commit()
    
    print("  ✓ Seeding completed successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Validate Cohort Retrieval and Analytics aggregates
    # ----------------------------------------------------
    print("[Step 5] Auditing GET /supervisor/students cohort reporting endpoint...")
    
    res_cohort = client.get(
        "/api/v1/thesis/supervisor/students",
        headers=headers_supervisor
    )
    assert res_cohort.status_code == 200
    
    report = res_cohort.json()
    assert len(report["students"]) == 1
    
    student_summary = report["students"][0]
    assert student_summary["student_email"] == "scholar_student@university.edu"
    assert student_summary["thesis_title"] == "B2B Educational SaaS dashboards and Swarmed AI verification"
    assert student_summary["plagiarism_index"] == 0.12  # highest recorded index
    assert student_summary["interaction_count"] == 2     # two conversation bubbles
    assert student_summary["verification_sig"].startswith("VERITAS-AUTH-SIG-")
    
    # Check cohort aggregates
    assert report["total_interactions"] == 2
    assert report["unlocks_cleared"] == 1
    assert report["average_integrity"] == 88.0  # 100 - (0.12 * 100)
    
    print(f"  ✓ Cohort Summary: Successfully retrieved reporting dashboards!")
    print(f"      - Cohort size: {len(report['students'])} active student(s)")
    print(f"      - Cohort Avg Integrity Index: {report['average_integrity']:.1f}%")
    print(f"      - Socratic dialogue count: {report['total_interactions']} interactions")
    print(f"      - Locks unlocked count: {report['unlocks_cleared']} gates")
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_dashboard_test.db"):
        os.remove("./veritas_dashboard_test.db")
        
    print("=" * 60)
    print("   ALL SUPERVISOR COHORT & SaaS TESTS PASSED SUCCESSFULLY!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_supervisor_dashboard_suite()
