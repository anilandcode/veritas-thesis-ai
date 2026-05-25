import os
import sys
import json
import asyncio
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_enterprise_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.academic_clients import fetch_all_academic_papers, _SWARM_CACHE
except ImportError as e:
    print(f"[Verification Enterprise Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_enterprise_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 12 ENTERPRISE MULTI-TENANCY TEST SUITE   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed Institution & Department
    # ----------------------------------------------------
    print("[Step 1] Seeding Stanford University and CS Department B2B models...")
    
    inst = models.Institution(
        name="Stanford University",
        domain="stanford.edu"
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    
    dept = models.Department(
        name="Computer Science",
        institution_id=inst.id,
        dean_email="dean@stanford.edu"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    
    print("  ✓ Institution and Department seeded successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 2: Seed Users (Dean, Advisor, Student)
    # ----------------------------------------------------
    print("[Step 2] Provisioning Dean, Advisor, and Student credentials...")
    
    # Dean (using mock credentials that will map automatically)
    dean = models.User(
        email="dean@veritas.ai",
        hashed_password="secure_password",
        full_name="Dean John Hennessy",
        is_dean=True,
        is_supervisor=False,
        institution_id=inst.id,
        department_id=dept.id
    )
    db.add(dean)
    
    advisor = models.User(
        email="advisor@veritas.ai",
        hashed_password="secure_password",
        full_name="Dr. Jane Advisor",
        is_dean=False,
        is_supervisor=True,
        institution_id=inst.id,
        department_id=dept.id
    )
    db.add(advisor)
    
    student = models.User(
        email="student@veritas.ai",
        hashed_password="secure_password",
        full_name="Alice Student",
        is_dean=False,
        is_supervisor=False,
        institution_id=inst.id,
        department_id=dept.id
    )
    db.add(student)
    db.commit()
    
    # Auth headers
    headers_dean = {"Authorization": "Bearer mock_user_dean"}
    headers_student = {"Authorization": "Bearer mock_user_student"}
    headers_advisor = {"Authorization": "Bearer mock_user_advisor"}
    
    print("  ✓ User profiles successfully seeded.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Seed Student Thesis & Timeline Logs
    # ----------------------------------------------------
    print("[Step 3] Seeding student thesis, outlines, and authorship ledger logs...")
    
    thesis = models.Thesis(
        user_id=student.id,
        title="Scaling Multi-Agent Swarms with Caching",
        topic_description="B2B optimization systems for research paper collection.",
        supervisor_email="advisor@veritas.ai",
        status="Drafting"
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Seed Completed chapter milestone
    outline1 = models.ThesisOutline(
        thesis_id=thesis.id,
        section_title="Context & Swarm Routing",
        section_key="context",
        draft_text="Active caching avoids SemSchol 429 exceptions.",
        status="Completed"
    )
    db.add(outline1)
    
    # Seed active drafting checkpoint
    outline2 = models.ThesisOutline(
        thesis_id=thesis.id,
        section_title="Problem Statement",
        section_key="problem",
        draft_text="Duplicate swarms trigger high server costs.",
        status="Drafting"
    )
    db.add(outline2)
    
    # Seed AuthorshipLedger timeline logs to compute VSM originality average
    log1 = models.AuthorshipLedger(
        thesis_id=thesis.id,
        section_key="context",
        action="save_draft",
        character_count=100,
        plagiarism_index=0.25, # 75.0% Originality
        verification_sig="VERITAS-AUTH-SIG-1"
    )
    db.add(log1)
    
    # Seed Socratic dialogues to test Dean average dialogues metric
    dialog1 = models.SocraticDialog(
        thesis_id=thesis.id,
        section="context",
        role="user",
        content="Explain caching"
    )
    db.add(dialog1)
    db.commit()
    
    print("  ✓ Completed Alice's progression log seeds.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Test Dean Role Security Guards
    # ----------------------------------------------------
    print("[Step 4] Auditing Dean role authorization guards...")
    
    # regular student tries to view analytics
    res_student_analytics = client.get(
        "/api/v1/admin/analytics",
        headers=headers_student
    )
    assert res_student_analytics.status_code == 403
    
    # authenticated dean requests analytics
    res_dean_analytics = client.get(
        "/api/v1/admin/analytics",
        headers=headers_dean
    )
    assert res_dean_analytics.status_code == 200
    analytics_data = res_dean_analytics.json()
    
    # Assert analytics calculation values are mathematically correct:
    assert analytics_data["active_students_count"] == 1
    assert analytics_data["total_theses"] == 1
    assert analytics_data["average_originality_index"] == 75.0 # (100 - (0.25 * 100))
    assert analytics_data["average_socratic_dialogs"] == 1.0
    assert analytics_data["unlocked_milestones_ratio"] == 50.0 # 1 out of 2 completed
    
    print("  ✓ Security checks passed. Dean analytics calculations are 100% correct.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Test Dean Administrative Hold & Export Gating
    # ----------------------------------------------------
    print("[Step 5] Checking Dean administrative holds and export gating controls...")
    
    # Dean toggles hold ON
    res_hold_on = client.post(
        f"/api/v1/admin/theses/{thesis.id}/hold",
        json={"administrative_hold": True},
        headers=headers_dean
    )
    assert res_hold_on.status_code == 200
    assert res_hold_on.json()["administrative_hold"] is True
    
    # Student attempts to compile/export thesis -> Gated!
    res_student_export = client.get(
        f"/api/v1/thesis/{thesis.id}/export",
        headers=headers_student
    )
    assert res_student_export.status_code == 403
    assert "gated by Dean's administrative hold" in res_student_export.json()["detail"]
    
    # Dean releases hold (toggles hold OFF)
    res_hold_off = client.post(
        f"/api/v1/admin/theses/{thesis.id}/hold",
        json={"administrative_hold": False},
        headers=headers_dean
    )
    assert res_hold_off.status_code == 200
    assert res_hold_off.json()["administrative_hold"] is False
    
    # Student attempts export again -> Cleared!
    res_student_export_cleared = client.get(
        f"/api/v1/thesis/{thesis.id}/export",
        headers=headers_student
    )
    assert res_student_export_cleared.status_code == 200
    
    print("  ✓ Dean Hold system gates student portfolio compilation successfully.")
    print("-" * 60)

    # ----------------------------------------------------
    # STEP 6: Test Literature Swarm Cache Hit Parity
    # ----------------------------------------------------
    print("[Step 6] Testing deduplicated literature cache hits...")
    
    # Clear cache
    _SWARM_CACHE.clear()
    
    # Simulated search execution (async)
    loop = asyncio.get_event_loop()
    query = "Socratic active caching protocols"
    
    # Pre-seed one cache entry to isolate network fetches
    mock_papers = [{"title": "Cached Paper", "doi": "10.1000/cached.doi", "authors": "Scholar"}]
    _SWARM_CACHE[query.strip().lower()] = mock_papers
    
    # Run fetch
    papers = loop.run_until_complete(fetch_all_academic_papers(query))
    assert len(papers) == 1
    assert papers[0]["title"] == "Cached Paper"
    
    print("  ✓ Swarm Caching verified successfully. Cache HIT served locally.")
    print("-" * 60)
    
    db.close()
    
    # Clean up database
    if os.path.exists("./veritas_enterprise_test.db"):
        os.remove("./veritas_enterprise_test.db")
        
    print("=" * 60)
    print("   ALL VERITAS AI WEEK 12 ENTERPRISE TESTS PASSED SUCCESSFULLY!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_enterprise_suite()
