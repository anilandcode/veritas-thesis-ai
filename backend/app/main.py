from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import general, auth, thesis, socratic, admin

# Initialize Database tables automatically on start (plug-and-play)
Base.metadata.create_all(bind=engine)

# Auto-apply database schema column migrations (SQLite & PostgreSQL compatible)
from sqlalchemy import text
try:
    with engine.begin() as conn:
        # 1. users table schema migrations
        for col, col_type in [
            ("is_supervisor", "BOOLEAN DEFAULT FALSE"),
            ("is_dean", "BOOLEAN DEFAULT FALSE"),
            ("institution_id", "INTEGER"),
            ("department_id", "INTEGER")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} {col_type}"))
            except Exception:
                pass  # Column already exists or table doesn't have connection
                
        # 2. research_papers table schema migrations
        for col, col_type in [
            ("is_retracted", "BOOLEAN DEFAULT FALSE"),
            ("retraction_details", "TEXT"),
            ("licence", "VARCHAR")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE research_papers ADD COLUMN {col} {col_type}"))
            except Exception:
                pass  # Column already exists
except Exception as e:
    print(f"[Migration Warning] Auto-migrations skipped or failed: {str(e)}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="The secure Socratic thesis mentor and autonomous background research engine."
)

# Set CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(general.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(thesis.router, prefix=settings.API_V1_STR)
app.include_router(socratic.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Veritas AI Socratic Mentor System",
        "api_documentation": "/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
