import os
import sys
from fastapi.testclient import TestClient

# Initialize testing environment variables
os.environ["DATABASE_URL"] = "sqlite:///./veritas_auth_test.db"

try:
    from app.main import app
    from app.database import Base, engine
except ImportError as e:
    print(f"[Auth Production Test] Critical Error: Unable to import app. Ensure python path is correct: {str(e)}")
    sys.exit(1)

# Ensure fresh test database tables are created
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_auth_tests():
    print("=" * 60)
    print("  VERITAS AI — PRODUCTION AUTHENTICATION & SECURITY TEST  ")
    print("=" * 60)

    # ----------------------------------------------------
    # TEST 1: Register a new user securely
    # ----------------------------------------------------
    print("[Test 1] Testing Production Signup (/api/v1/auth/signup)...")
    signup_payload = {
        "email": "production_scholar@veritas.ai",
        "password": "securepassword123",
        "full_name": "Alexander Daylight"
    }
    
    res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert res.status_code == 200
    signup_data = res.json()
    
    assert "access_token" in signup_data
    assert signup_data["token_type"] == "bearer"
    assert signup_data["user"]["email"] == "production_scholar@veritas.ai"
    assert signup_data["user"]["full_name"] == "Alexander Daylight"
    
    # Store token for later testing
    prod_token = signup_data["access_token"]
    print("  ✓ Successfully signed up production user and received JWT token")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 2: Duplicate email signup failure
    # ----------------------------------------------------
    print("[Test 2] Testing Signup Duplicate Block...")
    res = client.post("/api/v1/auth/signup", json=signup_payload)
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"].lower()
    print("  ✓ Correctly blocks duplicate email signups")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 3: Login with correct password
    # ----------------------------------------------------
    print("[Test 3] Testing Production Login (/api/v1/auth/login) - Success...")
    login_payload = {
        "email": "production_scholar@veritas.ai",
        "password": "securepassword123"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 200
    login_data = res.json()
    
    assert "access_token" in login_data
    assert login_data["token_type"] == "bearer"
    assert login_data["user"]["email"] == "production_scholar@veritas.ai"
    print("  ✓ Successfully authenticated user with cryptographically verified password")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 4: Login with incorrect password
    # ----------------------------------------------------
    print("[Test 4] Testing Production Login - Failure on Invalid Password...")
    bad_login_payload = {
        "email": "production_scholar@veritas.ai",
        "password": "wrongpassword"
    }
    res = client.post("/api/v1/auth/login", json=bad_login_payload)
    assert res.status_code == 401
    assert "invalid credentials" in res.json()["detail"].lower()
    print("  ✓ Correctly rejects login request with wrong password")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 5: Auth Guard access with production JWT
    # ----------------------------------------------------
    print("[Test 5] Accessing protected route with signed Production JWT...")
    headers = {"Authorization": f"Bearer {prod_token}"}
    
    res = client.post(
        "/api/v1/thesis/create",
        json={
            "title": "Quantum Cryptography and Socratic Consensus",
            "topic_description": "We explore quantum entanglement structures as a mechanism for verifying claims."
        },
        headers=headers
    )
    assert res.status_code == 200
    thesis_data = res.json()
    assert thesis_data["title"] == "Quantum Cryptography and Socratic Consensus"
    assert thesis_data["status"] == "Generating Shadow"
    print("  ✓ Successfully accessed protected /thesis/create with production JWT token")
    print("-" * 60)

    # ----------------------------------------------------
    # TEST 6: Mock Token Bypass Backward Compatibility
    # ----------------------------------------------------
    print("[Test 6] Verifying backward-compatible mock token bypass...")
    mock_headers = {"Authorization": "Bearer mock_user_legacy_academic"}
    
    res = client.post(
        "/api/v1/thesis/create",
        json={
            "title": "Mock Thesis Title",
            "topic_description": "Exploring baseline mock thesis structures."
        },
        headers=mock_headers
    )
    assert res.status_code == 200
    mock_thesis_data = res.json()
    assert mock_thesis_data["title"] == "Mock Thesis Title"
    print("  ✓ Secure mock token bypass remains fully operational (Zero regression on automated test routes)")
    print("-" * 60)

    print("=" * 60)
    print("      ALL PRODUCTION AUTHENTICATION TESTS PASSED OK!      ")
    print("=" * 60)

    # Clean up test database
    if os.path.exists("./veritas_auth_test.db"):
        os.remove("./veritas_auth_test.db")

if __name__ == "__main__":
    run_auth_tests()
