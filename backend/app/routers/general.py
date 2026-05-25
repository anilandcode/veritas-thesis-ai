from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas import HealthCheckOut
from app.config import settings

router = APIRouter(tags=["General"])

@router.get("/health", response_model=HealthCheckOut)
def health_check(db: Session = Depends(get_db)):
    db_status = "unhealthy"
    try:
        # Run simple query to verify connection
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        
    return {
        "status": "healthy",
        "database": db_status,
        "version": settings.VERSION
    }
