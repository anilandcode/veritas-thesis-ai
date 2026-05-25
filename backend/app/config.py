import os
from dotenv import load_dotenv

# Load env variables from .env file if it exists
load_dotenv()

class Settings:
    PROJECT_NAME: str = "Veritas AI Backend"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///./veritas.db"  # Fallback to local SQLite for development
    )
    
    # LLM Settings
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # CORS Origins
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://veritas-thesis-ai.vercel.app",  # Production Vercel deploy
    ]

settings = Settings()
