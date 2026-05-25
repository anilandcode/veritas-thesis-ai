import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_ledger_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification Ledger Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_supervisor_ledger_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 8 SUPERVISOR AUDIT LEDGER TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed User, Thesis, and Papers
    # ----------------------------------------------------
    print("[Step 1] Seeding graduate scholar and thesis outline...")
    user = models.User(email="ledger_scholar@veritas.ai", hashed_password="secure_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="B2B Cryptographic Ledgers and Supervision Auditing",
        topic_description="Designing secure, reproducible progress signature certificates."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Pre-seed research papers
    p1 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Reproducible Academic Verification Frameworks",
        authors="Dr. A. Ledger",
        journal="Journal of Academic Integrity",
        year=2026,
        doi="10.1000/mock.verification.ledger",
        abstract="We demonstrate that database-level authorship auditing trails prevent academic dishonesty.",
        citation_count=12,
        confidence_level=9.9
    )
    db.add(p1)
    db.commit()
    
    # Execute shadow generation to seed outline
    trigger_shadow_thesis_generation(thesis.id, db)
    db.refresh(thesis)
    
    # Pre-seed verified claims for synthesis checking
    claim = models.VerifiedClaim(
        thesis_id=thesis.id,
        section="Introduction",
        claim_text="Database-level authorship auditing trails prevent academic dishonesty.",
        supporting_dois="10.1000/mock.verification.ledger",
        confidence_score=2.0,
        verification_status="Verified"
    )
    db.add(claim)
    db.commit()
    
    print(f"  ✓ Seed complete. Thesis ID: {thesis.id}. Active claims cached.")
    print("-" * 60)
    
    headers = {"Authorization": f"Bearer mock_user_ledger_scholar"}
    
    # ----------------------------------------------------
    # STEP 2: Validate Autosave Hook & save_draft Logging
    # ----------------------------------------------------
    print("[Step 2] Testing outline autosave hook & ledger logging...")
    
    # Save a draft
    res_save = client.post(
        f"/api/v1/thesis/{thesis.id}/outline/save",
        json={
            "section_key": "context",
            "text": "This is a custom draft exploring reproducible academic verification frameworks."
        },
        headers=headers
    )
    assert res_save.status_code == 200
    
    # Check if a ledger entry of action "save_draft" was automatically created
    ledger_items = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id,
        models.AuthorshipLedger.action == "save_draft"
    ).all()
    
    assert len(ledger_items) >= 1
    autosave_log = ledger_items[-1]
    assert autosave_log.section_key == "context"
    assert "reproducible" in autosave_log.draft_text
    assert autosave_log.character_count > 10
    assert autosave_log.verification_sig.startswith("VERITAS-AUTH-SIG-")
    
    print(f"  ✓ Save Draft Hook: Log created successfully.")
    print(f"      - Generated Signature: \"{autosave_log.verification_sig}\"")
    print(f"      - Saved Text Length: {autosave_log.character_count} chars")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Validate Unlock Next (Early Failures & audit_failure Logging)
    # ----------------------------------------------------
    print("[Step 3] Auditing unlock gating failures and audit_failure logs...")
    
    # Try to unlock with a draft that is too short
    res_fail_short = client.post(
        f"/api/v1/thesis/{thesis.id}/outline/unlock-next",
        headers=headers
    )
    assert res_fail_short.status_code == 400
    
    # Check if a ledger entry of action "audit_failure" was logged
    fail_items = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id,
        models.AuthorshipLedger.action == "audit_failure"
    ).all()
    
    assert len(fail_items) >= 1
    fail_log = fail_items[-1]
    assert fail_log.section_key == "context"
    print(f"  ✓ Audit Failure Hook: Successfully logged failed verification attempt (Length Gating).")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Validate Successful Unlock & unlock_section Logging
    # ----------------------------------------------------
    print("[Step 4] Auditing successful unlock and unlock_section logs...")
    
    # Update active section draft text to meet all length, plagiarism, and synthesis gates
    # Synthesized text contains "database-level", "authorship", "auditing" and "reproducible" from claims & papers
    valid_text = (
        "We investigate secure database-level authorship auditing trails and original synthesis processes. "
        "These automated verifications actively prevent academic dishonesty by tracing chronological student edits "
        "and comparing them against indexed DOIs. This serves as the core context of our research paper."
    )
    
    res_save_valid = client.post(
        f"/api/v1/thesis/{thesis.id}/outline/save",
        json={
            "section_key": "context",
            "text": valid_text
        },
        headers=headers
    )
    assert res_save_valid.status_code == 200
    
    # Attempt unlock again
    res_unlock = client.post(
        f"/api/v1/thesis/{thesis.id}/outline/unlock-next",
        headers=headers
    )
    assert res_unlock.status_code == 200
    
    # Check if a ledger entry of action "unlock_section" was successfully written
    unlock_items = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id,
        models.AuthorshipLedger.action == "unlock_section"
    ).all()
    
    assert len(unlock_items) >= 1
    unlock_log = unlock_items[-1]
    assert unlock_log.section_key == "context"
    assert unlock_log.synthesis_count >= 2
    
    # Save the signature for B2B verification tests
    verification_signature = unlock_log.verification_sig
    
    print(f"  ✓ Unlock Success Hook: Section Context unlocked successfully.")
    print(f"      - Logged Action: \"{unlock_log.action}\"")
    print(f"      - Plagiarism Score: {unlock_log.plagiarism_index * 100:.1f}%")
    print(f"      - Synthesized claim keywords count: {unlock_log.synthesis_count} matches")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Validate Public Supervisor Verification Endpoint
    # ----------------------------------------------------
    print("[Step 5] Checking B2B Supervisor Verification lookup endpoint...")
    
    # Test lookup with invalid signature
    res_invalid_sig = client.get(
        "/api/v1/thesis/verify-certificate/VERITAS-AUTH-SIG-MOCKFAIL-05/24/2026"
    )
    assert res_invalid_sig.status_code == 404
    
    # Test lookup with valid signature
    res_verify = client.get(
        f"/api/v1/thesis/verify-certificate/{verification_signature}"
    )
    assert res_verify.status_code == 200
    
    report = res_verify.json()
    assert report["student_email"] == "ledger_scholar@veritas.ai"
    assert report["thesis_title"] == "B2B Cryptographic Ledgers and Supervision Auditing"
    assert report["section_key"] == "context"
    assert report["verification_sig"] == verification_signature
    assert len(report["timeline"]) >= 3  # save_draft, audit_failure, unlock_section
    assert len(report["outline"]) == 4
    
    # Check order of timeline logs (should be chronologically ascending)
    timeline_ids = [item["id"] for item in report["timeline"]]
    assert timeline_ids == sorted(timeline_ids)
    
    print(f"  ✓ B2B Verification Portal: Successfully retrieved progress verification certificate report!")
    print(f"      - Verified Student: {report['student_email']}")
    print(f"      - Verified Thesis: \"{report['thesis_title']}\"")
    print(f"      - Chronological Trail Length: {len(report['timeline'])} historical audit checkpoints")
    
    db.close()
    
    # Clean up database
    if os.path.exists("./veritas_ledger_test.db"):
        os.remove("./veritas_ledger_test.db")
        
    print("=" * 60)
    print("   ALL SUPERVISOR LEDGER & B2B PORTAL TESTS PASSED!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_supervisor_ledger_suite()
