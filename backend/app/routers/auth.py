from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.services import security

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/signup", response_model=schemas.Token)
def signup(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already registered
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 2. Hash the password cryptographically
    hashed = security.get_password_hash(user_in.password)
    
    # 3. Create and save the new user
    new_user = models.User(
        email=user_in.email,
        hashed_password=hashed,
        full_name=user_in.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. Generate a secure, cryptographically signed JWT
    access_token = security.create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "is_supervisor": new_user.is_supervisor,
            "is_dean": new_user.is_dean
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=schemas.Token)
def login(user_in: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Lookup user by email
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 2. Verify password securely (timing-attack resistant)
    if not security.verify_password(user_in.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # 3. Generate a secure, cryptographically signed JWT
    access_token = security.create_access_token(
        data={
            "sub": str(db_user.id),
            "email": db_user.email,
            "is_supervisor": db_user.is_supervisor,
            "is_dean": db_user.is_dean
        }
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }
