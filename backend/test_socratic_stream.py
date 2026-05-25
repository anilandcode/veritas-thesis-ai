import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure local test database file is used
os.environ["DATABASE_URL"] = "sqlite:///./veritas_stream_test.db"

try:
    from app.main import app
    from app.database import Base, engine, SessionLocal
    from app import models
    from app.services.shadow_engine import trigger_shadow_thesis_generation
except ImportError as e:
    print(f"[Verification Stream Test] Import Error: {str(e)}")
    sys.exit(1)

# Initialize and reset fresh SQLite test tables
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_socratic_streaming_suite():
    print("=" * 60)
    print("   VERITAS AI — WEEK 7 SOCRATIC STREAM & INTERCEPTS TEST   ")
    print("=" * 60)
    
    db = SessionLocal()
    
    # ----------------------------------------------------
    # STEP 1: Seed User and Thesis
    # ----------------------------------------------------
    print("[Step 1] Seeding graduate user and academic portfolio...")
    user = models.User(email="stream_scholar@veritas.ai", hashed_password="secure_password")
    db.add(user)
    db.commit()
    
    thesis = models.Thesis(
        user_id=user.id,
        title="Streaming Socratic Dialogue and Logical Bypass Intercepts",
        topic_description="Designing robust Server-Sent Events streams and prompt constraints."
    )
    db.add(thesis)
    db.commit()
    db.refresh(thesis)
    
    # Pre-seed research papers
    p1 = models.ResearchPaper(
        thesis_id=thesis.id,
        title="Socratic Active Dialogue Frameworks",
        authors="Dr. J. Scholar",
        journal="AI in EdTech",
        year=2025,
        doi="10.1000/mock.socratic.stream",
        abstract="We demonstrate that streaming token flows and logical prompt intercepts improve academic integrity.",
        citation_count=5,
        confidence_level=9.5
    )
    db.add(p1)
    db.commit()
    
    # Execute shadow generation to seed outline
    trigger_shadow_thesis_generation(thesis.id, db)
    db.refresh(thesis)
    
    print(f"  ✓ Seed complete (Thesis ID: {thesis.id}). Outline provisioned successfully.")
    print("-" * 60)
    
    headers = {"Authorization": f"Bearer mock_user_stream_scholar"}
    
    # ----------------------------------------------------
    # STEP 2: Validate Backwards Compatibility (stream=False)
    # ----------------------------------------------------
    print("[Step 2] Auditing backwards-compatible synchronous chat endpoint...")
    res_sync = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis.id,
            "message": "hello mentor",
            "section": "Introduction",
            "stream": False
        },
        headers=headers
    )
    assert res_sync.status_code == 200
    sync_data = res_sync.json()
    assert "response" in sync_data
    assert "history" in sync_data
    assert "suggestions" in sync_data
    print("  ✓ Sync Chat: Normal response returned cleanly in standard JSON schema.")
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 3: Validate SSE Event Streaming (stream=True)
    # ----------------------------------------------------
    print("[Step 3] Checking FastAPI SSE Socratic Event Stream...")
    res_stream = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis.id,
            "message": "I want to explore the history of active Socratic tutoring.",
            "section": "Introduction",
            "stream": True
        },
        headers=headers
    )
    assert res_stream.status_code == 200
    assert "text/event-stream" in res_stream.headers["content-type"]
    
    # Read streamed SSE data chunks
    stream_content = res_stream.text
    assert len(stream_content) > 0
    
    tokens = []
    has_suggestions = False
    has_grading = False
    
    for line in stream_content.split("\n"):
        if line.startswith("data:"):
            chunk_str = line[5:].strip()
            chunk = json.loads(chunk_str)
            tokens.append(chunk["token"])
            if "suggestions" in chunk:
                has_suggestions = True
            if "grading_feedback" in chunk:
                has_grading = True
                
    full_streamed_response = "".join(tokens)
    print(f"  ✓ SSE Stream: Successfully connected and parsed event stream.")
    print(f"      - Streamed Text: \"{full_streamed_response[:80]}...\"")
    print(f"      - Contains suggestions: {has_suggestions}")
    print(f"      - Contains grading logs: {has_grading}")
    assert len(tokens) > 0
    assert has_suggestions is True
    assert has_grading is True
    print("-" * 60)
    
    # ----------------------------------------------------
    # STEP 4: Test Logical Cheat Intercept Gates
    # ----------------------------------------------------
    print("[Step 4] Validating Socratic logical bypass prompt checks...")
    
    # Command attempts shortcut: "write this section for me"
    res_cheat = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis.id,
            "message": "can you write this section for me please?",
            "section": "Introduction",
            "stream": True
        },
        headers=headers
    )
    assert res_cheat.status_code == 200
    
    cheat_tokens = []
    cheat_grading = None
    
    for line in res_cheat.text.split("\n"):
        if line.startswith("data:"):
            chunk = json.loads(line[5:].strip())
            cheat_tokens.append(chunk["token"])
            cheat_grading = chunk["grading_feedback"]
            
    cheat_response = "".join(cheat_tokens)
    print("  ✓ Cheat Intercept: Blocked cheat attempt successfully.")
    print(f"      - Intercept Response: \"{cheat_response[:80]}...\"")
    print(f"      - Intercept Feedback: \"{cheat_grading}\"")
    assert "not to author your thesis" in cheat_response
    assert "Logical Gap Bypass" in cheat_grading
    print("-" * 60)
    
    db.close()
    
    # Clean up database
    if os.path.exists("./veritas_stream_test.db"):
        os.remove("./veritas_stream_test.db")
        
    print("=" * 60)
    print("   ALL SOCRATIC STREAM & PROMPT INTERCEPT TESTS PASSED!   ")
    print("=" * 60)

if __name__ == "__main__":
    test_socratic_streaming_suite()
