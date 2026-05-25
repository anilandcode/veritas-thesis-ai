import sys
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import SessionLocal, engine, Base
from app import models

def seed_database():
    print("[Database Seed] Starting verification and initialization...")
    
    # 1. Test database connection
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        print("[Database Seed] Database connection successful.")
    except Exception as e:
        print(f"[Database Seed] Critical Error: Unable to connect to database: {str(e)}")
        sys.exit(1)
        
    # 2. Check if pgvector is available (if PostgreSQL)
    is_sqlite = engine.url.drivername.startswith("sqlite")
    if not is_sqlite:
        try:
            # Check for pgvector extension
            db.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            print("[Database Seed] PostgreSQL pgvector extension enabled successfully.")
        except Exception as e:
            print(f"[Database Seed] Warning: Failed to enable pgvector: {str(e)}")
            print("[Database Seed] Ensure you have superuser rights or pgvector pre-installed on your cloud DB.")
            
    # 3. Create tables
    try:
        Base.metadata.create_all(bind=engine)
        print("[Database Seed] Database tables verified/created successfully.")
    except Exception as e:
        print(f"[Database Seed] Error creating tables: {str(e)}")
        sys.exit(1)
        
    # 4. Seed system/mock user
    try:
        system_user = db.query(models.User).filter(models.User.email == "system@veritas.ai").first()
        if not system_user:
            # Seed default system user
            system_user = models.User(
                email="system@veritas.ai",
                hashed_password="mock_hash_system_password",
                full_name="Veritas Core System",
                is_active=True
            )
            db.add(system_user)
            db.commit()
            db.refresh(system_user)
            print(f"[Database Seed] Seeded system user successfully (ID: {system_user.id}).")
        else:
            print("[Database Seed] System user already exists. Skipping.")
            
    except Exception as e:
        print(f"[Database Seed] Error seeding database data: {str(e)}")
        db.rollback()
    finally:
        db.close()
        
    print("[Database Seed] Database seeding and check complete.")

if __name__ == "__main__":
    seed_database()
