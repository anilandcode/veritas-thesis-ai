import os
import datetime
import hashlib
import secrets
from typing import Optional
import jwt

JWT_SECRET = os.getenv("JWT_SECRET", "veritas-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def get_password_hash(password: str) -> str:
    """
    Generates a secure PBKDF2 hash of a password with a random 16-byte salt
    and 100,000 iterations using SHA-256.
    """
    salt = os.urandom(16)
    iterations = 100000
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2_sha256${iterations}${salt.hex()}${key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a stored secure PBKDF2 hash.
    Maintains backward compatibility with legacy 'mock_hash_' prefixes.
    """
    # 1. Backward compatibility check for legacy mock hashes
    if hashed_password.startswith("mock_hash_"):
        return hashed_password == f"mock_hash_{plain_password}"
    
    # 2. Strict cryptographic PBKDF2 verification
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False
        
        iterations = int(parts[1])
        salt = bytes.fromhex(parts[2])
        stored_key = bytes.fromhex(parts[3])
        
        new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, iterations)
        return secrets.compare_digest(stored_key, new_key)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    """
    Generates a cryptographically-signed JWT access token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.datetime.utcnow()
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)
