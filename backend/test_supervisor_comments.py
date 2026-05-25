import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_comments_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
except ImportError as e:
    print(f"[Verification Comments Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_supervisor_comments_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 11 SUPERVISOR COMMENTS TEST SUITE   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed Student & Advisor Users
    # ----------------------------------------------------
    print("[Step 1] Seeding cohort student and advisor user profiles...")
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
    
    unauthorized_user = models.User(
        email="hacker@veritas.ai",
        hashed_password="secure_password",
        full_name="Malicious Hacker",
        is_supervisor=False
    )
    db.add(unauthorized_user)
    db.commit()
    
    # Auth headers
    headers_student = {"Authorization": "Bearer mock_user_student"}
    headers_advisor = {"Authorization": "Bearer mock_user_advisor"}
    headers_hacker = {"Authorization": "Bearer mock_user_hacker"}
    
    # ----------------------------------------------------
    # STEP 2: Create Student Thesis
    # ----------------------------------------------------
    print("[Step 2] Seeding candidate student research thesis...")
    thesis = models.Thesis(
        user_id=student.id,
        title="Interactive Socratic Commentary Frameworks",
        topic_description="Closing B2B education loops with real-time feedback loops.",
        supervisor_email="advisor@veritas.ai",
        status="Drafting"
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Seed one completed outline section
    outline = models.ThesisOutline(
        thesis_id=thesis.id,
        section_title="Context & Relevance",
        section_key="context",
        draft_text="Active Socratic comments hook into draft segments to stimulate student critical thinking.",
        status="Drafting"
    )
    db.add(outline)
    db.commit()
    
    print("  ✓ Student thesis and outline created successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Test Authorization Guard Restrictions
    # ----------------------------------------------------
    print("[Step 3] Auditing API role authorization checks...")
    
    # regular student tries to comment
    res_student_comment = client.post(
        f"/api/v1/thesis/{thesis.id}/comments",
        json={
            "section_key": "context",
            "highlighted_quote": "Socratic comments",
            "comment_text": "Is this term adequately verified?"
        },
        headers=headers_student
    )
    assert res_student_comment.status_code == 403
    
    # unauthorized supervisor tries to comment
    # Let's seed a secondary supervisor first
    other_advisor = models.User(
        email="other_advisor@veritas.ai",
        hashed_password="secure_password",
        full_name="Dr. Outcast Advisor",
        is_supervisor=True
    )
    db.add(other_advisor)
    db.commit()
    headers_other_advisor = {"Authorization": "Bearer mock_user_other_advisor"}
    
    res_other_advisor_comment = client.post(
        f"/api/v1/thesis/{thesis.id}/comments",
        json={
            "section_key": "context",
            "highlighted_quote": "Socratic comments",
            "comment_text": "Is this term adequately verified?"
        },
        headers=headers_other_advisor
    )
    assert res_other_advisor_comment.status_code == 403
    
    print("  ✓ Security check passed: Unauthorized supervisor and students blocked successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Advisor posts Socratic comment
    # ----------------------------------------------------
    print("[Step 4] Creating supervisor Socratic comment drop...")
    res_post_comment = client.post(
        f"/api/v1/thesis/{thesis.id}/comments",
        json={
            "section_key": "context",
            "highlighted_quote": "Socratic comments",
            "comment_text": "Please provide direct open-access literature sources confirming active Socratic annotations rates."
        },
        headers=headers_advisor
    )
    assert res_post_comment.status_code == 200
    
    comment_data = res_post_comment.json()
    assert comment_data["section_key"] == "context"
    assert comment_data["highlighted_quote"] == "Socratic comments"
    assert "open-access literature" in comment_data["comment_text"]
    assert comment_data["is_resolved"] is False
    
    print("  ✓ Advisor Socratic comment registered successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Student retrieves comments list
    # ----------------------------------------------------
    print("[Step 5] Checking student Socratic comments list retrieve...")
    res_get_comments = client.get(
        f"/api/v1/thesis/{thesis.id}/comments",
        headers=headers_student
    )
    assert res_get_comments.status_code == 200
    comments_list = res_get_comments.json()
    assert len(comments_list) == 1
    assert comments_list[0]["id"] == comment_data["id"]
    
    # Hacker tries to retrieve comments
    res_hacker_get = client.get(
        f"/api/v1/thesis/{thesis.id}/comments",
        headers=headers_hacker
    )
    assert res_hacker_get.status_code == 403
    
    print("  ✓ Comments listing and student isolation guards passed successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 6: Student resolves comments
    # ----------------------------------------------------
    print("[Step 6] Resolving advisor comment as student...")
    res_resolve = client.post(
        f"/api/v1/thesis/comments/{comment_data['id']}/resolve",
        headers=headers_student
    )
    assert res_resolve.status_code == 200
    resolved_comment = res_resolve.json()
    assert resolved_comment["is_resolved"] is True
    
    # Verify the comment is resolved in database
    comment_db = db.query(models.SupervisorComment).filter(models.SupervisorComment.id == comment_data["id"]).first()
    assert comment_db.is_resolved is True
    
    print("  ✓ Socratic comment resolved successfully.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 7: Assert Export report contains resolved comments
    # ----------------------------------------------------
    print("[Step 7] Validating thesis portfolio export aggregates...")
    
    # Let's drop a secondary comment which remains active (unresolved)
    client.post(
        f"/api/v1/thesis/{thesis.id}/comments",
        json={
            "section_key": "context",
            "comment_text": "Secondary outstanding conceptual suggestion."
        },
        headers=headers_advisor
    )
    
    # Fetch export data
    res_export = client.get(
        f"/api/v1/thesis/{thesis.id}/export",
        headers=headers_student
    )
    assert res_export.status_code == 200
    export_payload = res_export.json()
    
    assert export_payload["total_comments_count"] == 2
    assert export_payload["resolved_comments_count"] == 1
    
    print("  ✓ Academic Export payload contains comments metadata and counts aggregates.")
    print("      - Total Comments: 2")
    print("      - Resolved Comments: 1")
    print("-" * 60)
    
    db.close()
    
    # Clean up database
    if os.path.exists("./veritas_comments_test.db"):
        os.remove("./veritas_comments_test.db")
        
    print("=" * 60)
    print("   ALL VERITAS AI SUPERVISOR COMMENTS TESTS COMPLETED SUCCESSFULLY!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_supervisor_comments_suite()
