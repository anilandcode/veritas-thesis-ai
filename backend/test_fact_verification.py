import os
import asyncio
import sys

# Ensure database runs in local testing file
os.environ["DATABASE_URL"] = "sqlite:///./veritas_fact_test.db"

try:
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification Fact Test] Import Error: {str(e)}")
    sys.exit(1)

# Reset test database tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def test_fact_verification_pipeline():
    print("=" * 60)
    print("   VERITAS AI — WEEK 4 FACT VERIFICATION & GATE TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # 1. Seed User and Thesis
    user = models.User(email="verifier_scholar@veritas.ai", hashed_password="sso_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="Socratic Steering and Passive Retrieval in Graduate Seminars",
        topic_description="Investigating student retention rates under active steering systems."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    print(f"[Step 1] Seeded mock thesis: '{thesis.title}' (ID: {thesis.id})")
    
    # 2. Seed 3 Mock Research Papers to test the semantic overlap calculations
    # Paper 1: Supports Claim A (Socratic tutoring, retention, passive tools)
    p1 = models.ResearchPaper(
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
    # Paper 2: Supports Claim A (Socratic tutoring, retention) AND Claim B (9.0 threshold, background)
    p2 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Steering Thresholds in Background Models",
        authors="Prof. B. Academic",
        journal="Cognitive Systems Research",
        year=2024,
        doi="10.1000/arxiv.steering.thresholds",
        abstract="This paper outlines how Socratic tutoring models maintain student active retention. We argue that background models must hold a confidence threshold of at least 9.0/10 before triggering hints.",
        citation_count=20,
        confidence_level=9.5
    )
    # Paper 3: Does NOT support either (No Socratic, retention or threshold keywords)
    p3 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Unrelated Survey of NLP Parse Algorithms",
        authors="Jane Doe",
        journal="NLP Quarterly",
        year=2023,
        doi="10.1000/arxiv.nlp.unrelated",
        abstract="We review standard syntactic parser frameworks. Gzip compression algorithms show improved lexical performance.",
        citation_count=2,
        confidence_level=8.5
    )
    
    db.add_all([p1, p2, p3])
    db.commit()
    
    print("[Step 2] Seeded 3 distinct research papers with structured technical abstracts.")
    print("-" * 60)

    # 3. Trigger Swarmed Generation & Verification (async-to-sync ThreadPool bridged)
    print("[Step 3] Executing swarmed Shadow Thesis generation & verification...")
    print("         (Cross-referencing candidate claims against abstracts...)")
    
    trigger_shadow_thesis_generation(thesis.id, db)
    
    print("  ✓ Generation completed successfully.")
    print("-" * 60)

    # 4. Assert and Verify Database Gating & Statuses
    print("[Step 4] Querying and validating database VerifiedClaims...")
    
    # Reload thesis
    db.refresh(thesis)
    assert thesis.status == "Drafting"
    
    # Query all claim records generated
    claims = db.query(models.VerifiedClaim).filter(models.VerifiedClaim.thesis_id == thesis.id).all()
    assert len(claims) >= 2
    
    claim_a = None
    claim_b = None
    
    # Analyze the parsed claims
    for c in claims:
        if "retention" in c.claim_text.lower():
            claim_a = c
        elif "threshold" in c.claim_text.lower():
            claim_b = c
            
    print(f"  ✓ Claim A (Retention): '{claim_a.claim_text[:50]}...'")
    print(f"      - Supporting DOIs: {claim_a.supporting_dois}")
    print(f"      - Confidence Score: {claim_a.confidence_score} DOIs")
    print(f"      - Verification Status: {claim_a.verification_status}")
    
    # Claim A must PASS: Supported by Paper 1 (10.1000/arxiv.active.tutoring) AND Paper 2 (10.1000/arxiv.steering.thresholds) -> 2 DOIs!
    assert claim_a.confidence_score >= 2
    assert claim_a.verification_status == "Verified"
    print("      ✓ Gating Check: Claim A successfully PASSED the >= 2 DOI gate!")
    
    if claim_b:
        print(f"  ✓ Claim B (Threshold): '{claim_b.claim_text[:50]}...'")
        print(f"      - Supporting DOIs: {claim_b.supporting_dois}")
        print(f"      - Confidence Score: {claim_b.confidence_score} DOIs")
        print(f"      - Verification Status: {claim_b.verification_status}")
        
        # Claim B must FAIL: Supported ONLY by Paper 2 (10.1000/arxiv.steering.thresholds) -> 1 DOI!
        assert claim_b.confidence_score == 1
        assert claim_b.verification_status == "Unverified"
        print("      ✓ Gating Check: Claim B successfully BLOCKED (marked Unverified) by the >= 2 DOI gate!")
    
    # 5. Verify the Final Shadow Thesis ground-truth compilation
    print("-" * 60)
    print("[Step 5] Checking final ShadowThesis compiled literature text...")
    shadow_record = db.query(models.ShadowThesis).filter(models.ShadowThesis.thesis_id == thesis.id).first()
    assert shadow_record is not None
    
    # Claim A must be included, and Claim B must be completely excluded!
    assert "Socratic tutoring agents" in shadow_record.generated_text
    assert "confidence threshold" not in shadow_record.generated_text
    
    print("  ✓ Shadow Thesis compiled text includes Swarm Verified Claim A.")
    print("  ✓ Shadow Thesis compiled text completely EXCLUDED Unverified Claim B!")
    print("  ✓ Strict pedagogical facts gate is fully operational!")
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_fact_test.db"):
        os.remove("./veritas_fact_test.db")
        
    print("=" * 60)
    print("    ALL FACT VERIFICATION & GATING TESTS PASSED SUCCESSFULLY!    ")
    print("=" * 60)

if __name__ == "__main__":
    test_fact_verification_pipeline()
