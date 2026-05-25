import os
import sys
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_steering_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification Steering Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_active_steering_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 6 ACTIVE STEERING & LOCK UNLOCKS TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed User, Thesis, and Mock Papers
    # ----------------------------------------------------
    print("[Step 1] Seeding graduate user and academic portfolio...")
    user = models.User(email="thesis_editor@veritas.ai", hashed_password="secure_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="Socratic Active Outline Steering in AI-assisted Authorship",
        topic_description="Constructing a split-screen NotebookLM workspace that unlocks sections dynamically."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Seed research papers
    p1 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Socratic Tutoring Protocols and Peer-Review Frameworks",
        authors="Prof. B. Academic",
        journal="Active Learning Quarterly",
        year=2024,
        doi="10.1000/arxiv.socratic.protocols",
        abstract="We show that background shadow ground truth models guide critical student reasoning. Students achieve a 74 percent reduction in plagiarized content.",
        citation_count=25,
        confidence_level=9.7
    )
    db.add(p1)
    db.commit()
    
    print(f"  ✓ User, Thesis, and Paper seeded successfully (ID: {thesis.id})")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 2: Trigger Shadow Thesis & Outline Provisioning
    # ----------------------------------------------------
    print("[Step 2] Executing background shadow engine & outline provisioning...")
    trigger_shadow_thesis_generation(thesis.id, db)
    
    # Fetch provisioning results
    db.refresh(thesis)
    outlines = db.query(models.ThesisOutline).filter(models.ThesisOutline.thesis_id == thesis.id).order_by(models.ThesisOutline.id.asc()).all()
    
    assert len(outlines) == 4
    assert outlines[0].section_key == "context"
    assert outlines[0].status == "Drafting"
    assert outlines[1].section_key == "problem"
    assert outlines[1].status == "Locked"
    assert outlines[2].section_key == "objectives"
    assert outlines[2].status == "Locked"
    assert outlines[3].section_key == "significance"
    assert outlines[3].status == "Locked"
    
    print("  ✓ Outline successfully provisioned with 4 sections.")
    print("      - Context & Relevance: drafting (unlocked by default)")
    print("      - Problem Statement: locked")
    print("      - Research Objectives: locked")
    print("      - Significance: locked")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Validate GET and POST REST API endpoints
    # ----------------------------------------------------
    print("[Step 3] Auditing Outline save draft and access controls...")
    headers = {"Authorization": f"Bearer mock_user_thesis_editor"}
    
    # 1. Fetch outline checklist
    res_get = client.get(f"/api/v1/thesis/{thesis.id}/outline", headers=headers)
    assert res_get.status_code == 200
    assert len(res_get.json()) == 4
    print("  ✓ GET /thesis/{id}/outline retrieves 4 checkpoints")
    
    # 2. Save draft to unlocked active section (context)
    res_save = client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "context", "text": "Drafting context: This thesis explores modern academic architectures."},
      headers=headers
    )
    assert res_save.status_code == 200
    db.refresh(outlines[0])
    assert outlines[0].draft_text == "Drafting context: This thesis explores modern academic architectures."
    print("  ✓ POST /thesis/{id}/outline/save successfully autosaves draft text")
    
    # 3. Attempt to save draft to locked section (problem) - Must block!
    res_save_locked = client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "problem", "text": "Trying to write ahead..."},
      headers=headers
    )
    assert res_save_locked.status_code == 400
    assert "locked" in res_save_locked.json()["detail"].lower()
    print("  ✓ Save draft endpoint successfully blocks editing of locked sections")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Validate Socratic Audit Verification Gating
    # ----------------------------------------------------
    print("[Step 4] Testing Socratic Audit unlock verification gating...")
    
    # Audit Case A: Too short (< 100 characters) - Must block!
    client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "context", "text": "Draft text too short"},
      headers=headers
    )
    res_audit_short = client.post(f"/api/v1/thesis/{thesis.id}/outline/unlock-next", headers=headers)
    assert res_audit_short.status_code == 400
    assert "must be at least 100 characters" in res_audit_short.json()["detail"].lower()
    print("  ✓ Audit Gate: Blocked short draft successfully")
    
    # Audit Case B: High plagiarism (verbatim abstract copy) - Must block!
    client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "context", "text": "We show that background shadow ground truth models guide critical student reasoning. Students achieve a 74 percent reduction in plagiarized content."},
      headers=headers
    )
    res_audit_plag = client.post(f"/api/v1/thesis/{thesis.id}/outline/unlock-next", headers=headers)
    assert res_audit_plag.status_code == 400
    assert "plagiarism overlap" in res_audit_plag.json()["detail"].lower()
    print("  ✓ Audit Gate: Blocked plagiarized draft successfully")
    
    # Audit Case C: Valid unique synthesis lacking claim keywords - Must block!
    client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "context", "text": "This thesis introduces a fresh educational approach. We want to construct a responsive, modern glassmorphic dashboard where students can chat and get real-time peer feedback on their paragraphs."},
      headers=headers
    )
    res_audit_synthesis = client.post(f"/api/v1/thesis/{thesis.id}/outline/unlock-next", headers=headers)
    assert res_audit_synthesis.status_code == 400
    assert "does not incorporate core technical findings" in res_audit_synthesis.json()["detail"].lower()
    print("  ✓ Audit Gate: Blocked draft lacking literature synthesis keywords successfully")
    
    # Audit Case D: Valid unique synthesis with literature keyword overlap - Success!
    # Verified claims contain keywords: "Socratic", "retention", "Shadow", "threshold", etc.
    client.post(
      f"/api/v1/thesis/{thesis.id}/outline/save",
      json={"section_key": "context", "text": "This study examines the role of a background shadow model. Socratic tutoring agents can steer student knowledge retention and drop copy-paste risks. Socratic steerability thresholds are established to ground synthesis."},
      headers=headers
    )
    res_audit_success = client.post(f"/api/v1/thesis/{thesis.id}/outline/unlock-next", headers=headers)
    assert res_audit_success.status_code == 200
    success_data = res_audit_success.json()
    assert success_data["success"] is True
    assert success_data["unlocked_section_key"] == "problem"
    
    # Assert section statuses transitioned correctly in db!
    db.refresh(outlines[0])
    db.refresh(outlines[1])
    assert outlines[0].status == "Completed"
    assert outlines[1].status == "Drafting"
    
    # Assert assistant welcome message was injected in Socratic conversation history logs
    dialogs = db.query(models.SocraticDialog).filter(
        models.SocraticDialog.thesis_id == thesis.id,
        models.SocraticDialog.role == "assistant"
    ).all()
    assert len(dialogs) > 0
    assert "✓ Socratic Audit Passed" in dialogs[-1].content
    print("  ✓ Audit Gate: Successful synthesis draft unlocked next section!")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Test Socratic Response Dynamic Steering
    # ----------------------------------------------------
    print("[Step 5] Checking active Socratic Mentor dynamic steering response...")
    # Send a short message. Mentor must steer user specifically to write the "problem" section (the active section)
    res_chat = client.post(
      "/api/v1/socratic/chat",
      json={
        "thesis_id": thesis.id,
        "message": "hello",
        "section": "Introduction"
      },
      headers=headers
    )
    assert res_chat.status_code == 200
    chat_data = res_chat.json()
    assert "problem statement" in chat_data["response"].lower()
    print("  ✓ Socratic Mentor successfully steers dialogue to the new active drafting checkpoint!")
    print(f"  ✓ Socratic Response: \"{chat_data['response'][:90]}...\"")
    print("-" * 60)
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_steering_test.db"):
        os.remove("./veritas_steering_test.db")
        
    print("=" * 60)
    print("   ALL Socratic ACTIVE STEERING INTEGRATION TESTS PASSED!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_active_steering_suite()
