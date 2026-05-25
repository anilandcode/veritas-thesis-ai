import os
import sys
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_plag_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.plagiarism_detector import check_text_similarity
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification Plagiarism Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_plagiarism_integrity_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 5 PLAGIARISM DETECTION & GATE TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed User and Thesis
    # ----------------------------------------------------
    print("[Step 1] Seeding graduate user and thesis portfolio...")
    user = models.User(email="integrity_director@veritas.ai", hashed_password="secure_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="Socratic steering agents in education",
        topic_description="Evaluating Socratic steerability thresholds in grad education."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    print(f"  ✓ User and Thesis created successfully (ID: {thesis.id})")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 2: Seed Mock Papers with abstracts
    # ----------------------------------------------------
    print("[Step 2] Seeding research papers with technical abstracts...")
    p1 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Steering Thresholds in Background Models",
        authors="Prof. B. Academic",
        journal="Cognitive Systems Research",
        year=2024,
        doi="10.1000/arxiv.steering.thresholds",
        abstract="Background 'Shadow' models must maintain a confidence threshold of at least 9",
        citation_count=20,
        confidence_level=9.5
    )
    p2 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Active Tutoring and Student Retention",
        authors="Dr. A. Scholar",
        journal="Journal of Active Learning",
        year=2025,
        doi="10.1000/arxiv.active.tutoring",
        abstract="We demonstrate that Socratic tutoring agents significantly enhance student retention rates compared to passive traditional tools.",
        citation_count=12,
        confidence_level=9.8
    )
    db.add_all([p1, p2])
    db.commit()
    print("  ✓ Research papers successfully cached in database.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Validate VSM TF-IDF Cosine Similarity engine
    # ----------------------------------------------------
    print("[Step 3] Validating local TF-IDF Cosine Similarity boundaries...")
    
    # Test text A: Verbatim copy of p1 abstract
    verbatim_text = "Background 'Shadow' models must maintain a confidence threshold of at least 9"
    report_a = check_text_similarity(verbatim_text, [p1, p2])
    print(f"  ✓ Text A (Verbatim copy of Paper 1):")
    print(f"      - Similarity Score: {report_a['highest_similarity'] * 100:.1f}%")
    print(f"      - Matching Paper: {report_a['matching_paper_title']}")
    print(f"      - Risk Level: {report_a['plagiarism_risk']}")
    assert report_a["highest_similarity"] > 0.80
    assert report_a["plagiarism_risk"] == "High"
    
    # Test text B: Paraphrased version of p2
    paraphrased_text = "Our active study demonstrates that tutoring agents increase retention over passive traditional software systems."
    report_b = check_text_similarity(paraphrased_text, [p1, p2])
    print(f"  ✓ Text B (Paraphrased overlap):")
    print(f"      - Similarity Score: {report_b['highest_similarity'] * 100:.1f}%")
    print(f"      - Matching Paper: {report_b['matching_paper_title']}")
    print(f"      - Risk Level: {report_b['plagiarism_risk']}")
    assert 0.30 <= report_b["highest_similarity"] < 0.60
    assert report_b["plagiarism_risk"] == "Moderate"
    
    # Test text C: Valid original synthesis
    original_text = "Our thesis explores how university departments evaluate AI assistants under strict academic rubrics."
    report_c = check_text_similarity(original_text, [p1, p2])
    print(f"  ✓ Text C (Original unique synthesis):")
    print(f"      - Similarity Score: {report_c['highest_similarity'] * 100:.1f}%")
    print(f"      - Risk Level: {report_c['plagiarism_risk']}")
    assert report_c["highest_similarity"] < 0.30
    assert report_c["plagiarism_risk"] == "Low"
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Test Swarmed Claims Gating in shadow_engine.py
    # ----------------------------------------------------
    print("[Step 4] Checking swarmed claims plagiarism gating pipeline...")
    # Seed candidate claims text containing a plagiarized statement
    # The shadow thesis background generator will verify these. 
    # If the similarity is > 0.85, the claim status should be set to "Plagiarized" and excluded!
    
    # Let's run background swarmed generation. Note: query synthesizers return candidate claims.
    # We will verify that any swarmed claims that mimic verbatim abstract text are dropped.
    trigger_shadow_thesis_generation(thesis.id, db)
    
    # Refresh and load generated claims
    db.refresh(thesis)
    claims = db.query(models.VerifiedClaim).filter(models.VerifiedClaim.thesis_id == thesis.id).all()
    
    print(f"  ✓ Swarm finished. Harvested {len(claims)} candidate claims total.")
    plagiarized_claims = [c for c in claims if c.verification_status == "Plagiarized"]
    verified_claims = [c for c in claims if c.verification_status == "Verified"]
    
    # Assert that verbatim claims were successfully flagged and blocked from Verified state
    assert len(plagiarized_claims) > 0
    print(f"  ✓ Plagiarism Gating successfully BLOCKED {len(plagiarized_claims)} verbatim claims:")
    for c in plagiarized_claims:
        print(f"      - Blocked: '{c.claim_text[:50]}...' ({c.plagiarism_index * 100:.1f}% overlap)")
        assert c.plagiarism_index >= 0.80
        
    print(f"  ✓ Shadow Thesis compiled text includes ONLY {len(verified_claims)} non-plagiarized swarmed claims!")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 5: Test API Expositions POST /verify-draft
    # ----------------------------------------------------
    print("[Step 5] Auditing POST /verify-draft REST API endpoints...")
    headers = {"Authorization": f"Bearer mock_user_integrity_director"}
    
    # 1. Unauthenticated request must block
    res = client.post(f"/api/v1/thesis/{thesis.id}/verify-draft", json={"text": "Test"})
    assert res.status_code == 401
    print("  ✓ POST /verify-draft blocks unauthorized request")
    
    # 2. Authenticated request with copy-pasted text
    res = client.post(
        f"/api/v1/thesis/{thesis.id}/verify-draft",
        json={"text": verbatim_text},
        headers=headers
    )
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["plagiarism_risk"] == "High"
    assert res_data["matching_paper_doi"] == p1.doi
    print(f"  ✓ POST /verify-draft successfully catches verbatim paste ({res_data['highest_similarity'] * 100:.1f}%)")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 6: Test Real-time Socratic Chat Interventions
    # ----------------------------------------------------
    print("[Step 6] Verifying Socratic chat plagiarism interventions...")
    # Send plagiarized text in Socratic Chat. The mentor must interject and steer.
    res = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis.id,
            "message": verbatim_text,
            "section": "Introduction"
        },
        headers=headers
    )
    assert res.status_code == 200
    chat_data = res.json()
    
    # Socratic response must instruct student about academic integrity and plagiarism
    assert "plagiarism" in chat_data["grading_feedback"].lower()
    assert "integrity" in chat_data["response"].lower()
    print("  ✓ Socratic Mentor successfully intercepted plagiarism in dialogue!")
    print(f"  ✓ Mentor Response: \"{chat_data['response'][:80]}...\"")
    print(f"  ✓ Mentor Grading: \"{chat_data['grading_feedback']}\"")
    print("-" * 60)
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_plag_test.db"):
        os.remove("./veritas_plag_test.db")
        
    print("=" * 60)
    print("   ALL PLAGIARISM GATING & INTEGRITY TESTS PASSED SUCCESSFULLY!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_plagiarism_integrity_suite()
