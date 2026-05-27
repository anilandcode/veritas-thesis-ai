import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

# Clerk token configuration (Clerk public key / PEM or JWT verification settings)
# For production, verify Clerk JWT signature. For development/testing, fall back to mock verification.
JWT_SECRET = os.getenv("JWT_SECRET", "veritas-secret-key-change-in-production")
ALGORITHM = "HS256"

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    
    # 1. Dev Fallback for Easy Testing & Verification
    if token.startswith("mock_user_"):
        # Handle custom mock tokens e.g. "mock_user_1", "mock_user_system"
        email = f"{token[10:]}@veritas.ai"
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            is_dean = token.startswith("mock_user_dean")
            is_supervisor = token.startswith("mock_user_advisor") or token.startswith("mock_user_supervisor") or token == "mock_user_system"
            
            # Setup mock Institution / Department if needed
            inst = db.query(models.Institution).filter(models.Institution.domain == "stanford.edu").first()
            if not inst:
                inst = models.Institution(name="Stanford University", domain="stanford.edu")
                db.add(inst)
                db.commit()
                db.refresh(inst)
                
            dept = db.query(models.Department).filter(models.Department.name == "Computer Science", models.Department.institution_id == inst.id).first()
            if not dept:
                dept = models.Department(name="Computer Science", institution_id=inst.id, dean_email="dean@veritas.ai")
                db.add(dept)
                db.commit()
                db.refresh(dept)
                
            # Create user on the fly if not exists (Seamless integration)
            user = models.User(
                email=email,
                hashed_password=f"mock_hash_{token}",
                full_name=token[10:].replace("_", " ").title(),
                is_active=True,
                is_supervisor=is_supervisor,
                is_dean=is_dean,
                institution_id=inst.id,
                department_id=dept.id
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    # 2. Production JWT Token Verification (Clerk / Custom JWT)
    try:
        # Decode token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        email = payload.get("email")
        
        # Determine email fallback
        resolved_email = email
        if not resolved_email and sub and "@" in sub:
            resolved_email = sub
            
        if sub is None and email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is invalid (missing subject or email)",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token signature has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token signature is invalid: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Retrieve User or Create on the fly
    user = None
    if sub and sub.isdigit():
        user = db.query(models.User).filter(models.User.id == int(sub)).first()
    
    if not user and resolved_email:
        user = db.query(models.User).filter(models.User.email == resolved_email).first()
        
    if not user:
        if not resolved_email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is invalid (missing email claim for autoprovisioning)",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # User signed up via Clerk/Identity provider first; auto-provision in local DB
        full_name = payload.get("name", resolved_email.split("@")[0].title())
        user = models.User(
            email=resolved_email,
            hashed_password=f"oauth_sso_synthesis_key",
            full_name=full_name,
            is_active=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"[Auth Security] Auto-provisioned user {resolved_email} via authenticated JWT.")

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user profile"
        )
        
    return user
