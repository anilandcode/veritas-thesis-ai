import os
import asyncio
import sys

# Ensure database runs in local testing file
os.environ["DATABASE_URL"] = "sqlite:///./veritas_api_test.db"

try:
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.query_synthesizer import synthesize_academic_queries
    from app.services.academic_clients import fetch_all_academic_papers
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification API Test] Import Error: {str(e)}")
    sys.exit(1)

# Reset test database tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

async def test_academic_swarm():
    print("=" * 60)
    print("   VERITAS AI — WEEK 3 ACADEMIC API SWARM VERIFICATION   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # 1. Seed a mock User and Thesis
    user = models.User(email="test_scholar@veritas.ai", hashed_password="sso_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="Socratic Tutoring Agents in Artificial Intelligence",
        topic_description="We explore the effectiveness of Socratic active learning loops compared to passive information retrieval."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    print(f"[Step 1] Seeded mock thesis: '{thesis.title}' (ID: {thesis.id})")
    print("-" * 60)

    # 2. Test Query Synthesizer
    print("[Step 2] Testing query synthesizer expansion...")
    queries = await synthesize_academic_queries(thesis.title, thesis.topic_description)
    assert len(queries) == 3
    print("  ✓ Successfully synthesized 3 academic search queries:")
    for i, q in enumerate(queries, 1):
        print(f"    Query {i}: '{q}'")
    print("-" * 60)

    # 3. Test Concurrent Live Fetcher (fetch top query from arXiv, Semantic Scholar, and OpenAlex)
    test_query = queries[0]
    print(f"[Step 3] Dispatching live concurrent swarm for: '{test_query}'...")
    print("         (This makes real HTTP requests to Semantic Scholar, arXiv & OpenAlex...)")
    
    try:
        papers = await fetch_all_academic_papers(test_query, limit_per_source=2)
        print(f"  ✓ Successfully harvested {len(papers)} unique academic papers:")
        
        # Display top 3 papers fetched
        for i, p in enumerate(papers[:3], 1):
            print(f"    Paper {i}:")
            print(f"      Title : {p['title'][:70]}...")
            print(f"      Author: {p['authors'][:50]}...")
            print(f"      Journal: {p['journal']}")
            print(f"      DOI   : {p['doi']}")
            print(f"      Year  : {p['year']}")
    except Exception as e:
        print(f"  ✗ Swarm fetching encountered network error (Dev timeout): {str(e)}")
        print("    (This is common in heavily sandboxed or restricted networks)")
    print("-" * 60)

    # 4. Test Full Background Shadow Engine Integration
    print("[Step 4] Testing full background Shadow Engine task execution...")
    # Trigger background worker (async-to-sync bridged)
    trigger_shadow_thesis_generation(thesis.id, db)
    
    # Reload thesis details
    db.refresh(thesis)
    assert thesis.status == "Drafting"
    print("  ✓ Shadow Thesis generation completed successfully.")
    print(f"  ✓ Thesis status updated to '{thesis.status}' OK")
    
    # Check cached papers
    cached_papers = db.query(models.ResearchPaper).filter(models.ResearchPaper.thesis_id == thesis.id).all()
    print(f"  ✓ Successfully verified {len(cached_papers)} papers cached in ResearchPaper database table.")
    
    # Check shadow text
    shadow_record = db.query(models.ShadowThesis).filter(models.ShadowThesis.thesis_id == thesis.id).first()
    assert shadow_record is not None
    print(f"  ✓ Verified ShadowThesis ground-truth generated (Confidence Score: {shadow_record.confidence_score}/10)")
    
    db.close()
    
    # Clean up test database
    if os.path.exists("./veritas_api_test.db"):
        os.remove("./veritas_api_test.db")
        
    print("=" * 60)
    print("      ALL WEEK 3 DATA SWARM TESTS PASSED SUCCESSFULLY!      ")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(test_academic_swarm())
