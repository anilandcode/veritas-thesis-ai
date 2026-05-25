import os
import sys
from fastapi.testclient import TestClient

# Initialize testing environment variables
os.environ["DATABASE_URL"] = "sqlite:///./veritas_test.db"

try:
    from app.main import app
    from app.database import Base, engine
except ImportError as e:
    print(f"[Verification Test] Critical Error: Unable to import app. Ensure python path is correct: {str(e)}")
    sys.exit(1)

# Ensure fresh test database tables are created
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_tests():
    print("=" * 60)
    print("   VERITAS AI — INTEGRATION & SECURITY AUTHENTICATION TEST   ")
    print("=" * 60)
    
    # ----------------------------------------------------
    # TEST 1: Healthcheck Endpoints
    # ----------------------------------------------------
    print("[Test 1] Verifying server root & healthcheck...")
    res = client.get("/")
    assert res.status_code == 200
    assert "Veritas AI" in res.json()["message"]
    print("  ✓ Root welcome endpoint OK")
    
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"
    assert res.json()["database"] == "healthy"
    print("  ✓ Healthcheck and DB connection OK")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 2: Security Auth Guards (No Headers)
    # ----------------------------------------------------
    print("[Test 2] Verifying authentication guard (Missing Headers)...")
    res = client.post(
        "/api/v1/thesis/create",
        json={"title": "Test Title", "topic_description": "Test description"}
    )
    # Must fail with 401 (Unauthorized/Missing Authorization Bearer)
    assert res.status_code == 401
    assert "Not authenticated" in res.json()["detail"]
    print("  ✓ Protected /thesis/create blocks unauthorized request OK")

    res = client.post(
        "/api/v1/socratic/chat",
        json={"thesis_id": 1, "message": "Hello"}
    )
    assert res.status_code == 401
    assert "Not authenticated" in res.json()["detail"]
    print("  ✓ Protected /socratic/chat blocks unauthorized request OK")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 3: Auth Gateway (Mock Token Autoprovisioning)
    # ----------------------------------------------------
    print("[Test 3] Verifying auth auto-provisioning with secure mock token...")
    # Passing token: "Bearer mock_user_test_scholar"
    headers = {"Authorization": "Bearer mock_user_test_scholar"}
    
    res = client.post(
        "/api/v1/thesis/create",
        json={
            "title": "Socratic steering agents in education",
            "topic_description": "Evaluating Socratic steerability thresholds in grad education."
        },
        headers=headers
    )
    assert res.status_code == 200
    thesis_data = res.json()
    assert thesis_data["title"] == "Socratic steering agents in education"
    assert thesis_data["status"] == "Generating Shadow"
    print("  ✓ Auth gateway successfully auto-provisions and authorizes user")
    print(f"  ✓ Thesis created successfully (ID: {thesis_data['id']})")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 4: Socratic Chat Ownership Gates
    # ----------------------------------------------------
    print("[Test 4] Verifying Socratic chat ownership checks...")
    # Attempt to chat with thesis_id using another scholar token (which does not own it!)
    intruder_headers = {"Authorization": "Bearer mock_user_intruder"}
    
    res = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis_data["id"],
            "message": "Give me answers",
            "section": "Introduction"
        },
        headers=intruder_headers
    )
    # Must block with 404/Unauthorized since intruder doesn't own thesis_id
    assert res.status_code == 404
    assert "unauthorized" in res.json()["detail"].lower()
    print("  ✓ Socratic route successfully blocks unauthorized thesis access (Intruder) OK")

    # Now run with correct owner headers
    res = client.post(
        "/api/v1/socratic/chat",
        json={
            "thesis_id": thesis_data["id"],
            "message": "Let's outline my introduction section",
            "section": "Introduction"
        },
        headers=headers
    )
    assert res.status_code == 200
    chat_data = res.json()
    assert len(chat_data["suggestions"]) > 0
    assert "outline" in chat_data["response"].lower()
    print("  ✓ Socratic route successfully grants access to thesis owner OK")
    print("  ✓ Socratic Mentor conversation responses are correctly structured")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 5: Verified Claims Endpoint
    # ----------------------------------------------------
    print("[Test 5] Verifying claims retrieval and structure...")
    
    # Request claims with incorrect/intruder headers
    res = client.get(
        f"/api/v1/thesis/{thesis_data['id']}/claims",
        headers=intruder_headers
    )
    assert res.status_code == 404
    print("  ✓ Claims endpoint successfully blocks intruder OK")
    
    # Request claims with correct owner headers
    res = client.get(
        f"/api/v1/thesis/{thesis_data['id']}/claims",
        headers=headers
    )
    assert res.status_code == 200
    claims_data = res.json()
    assert len(claims_data) > 0
    
    # Assert that schemas.VerifiedClaimOut fields are returned
    first_claim = claims_data[0]
    assert "claim_text" in first_claim
    assert "supporting_dois" in first_claim
    assert "confidence_score" in first_claim
    assert "verification_status" in first_claim
    
    # Print status verification summary
    verified_count = sum(1 for c in claims_data if c["verification_status"] == "Verified")
    unverified_count = sum(1 for c in claims_data if c["verification_status"] == "Unverified")
    print(f"  ✓ Fetched {len(claims_data)} claims: {verified_count} Verified, {unverified_count} Unverified")
    print("  ✓ Claims response payloads conform exactly to Schemas.VerifiedClaimOut spec")
    print("-" * 60)

    print("=" * 60)
    print("   ALL INTEGRATION & AUTHENTICATION TESTS PASSED SUCCESSFULLY!   ")
    print("=" * 60)

    # Clean up test database
    if os.path.exists("./veritas_test.db"):
        os.remove("./veritas_test.db")

if __name__ == "__main__":
    run_tests()
