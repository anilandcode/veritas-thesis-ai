# Veritas AI — Socratic Research & Thesis Mentor (Week 1 Setup)

Welcome to **Veritas AI** (formerly Research Thesis AI System), the ultimate Socratic thesis mentor. This repository contains the complete foundation (Week 1–2 blueprint) for your startup MVP.

Veritas AI leverages an autonomous, hidden **"Shadow Thesis" Engine** in the background (which queries literature, indexes citations, and establishes ground-truth evidence) and serves it to students via an interactive **Socratic Mentor Workspace** to guide active reasoning and academic synthesis.

---

## Repository Structure

```
veritas-thesis-ai/
├── frontend/             # Next.js (React, TypeScript) - NotebookLM-style gorgeous UI
│   ├── src/app/
│   │   ├── globals.css   # Custom premium design system (Vanilla CSS, dark slate, glassmorphism)
│   │   ├── layout.tsx    # Root layout & Outfit Google Font integration
│   │   └── page.tsx      # Main workspace: Split document writing & Socratic chat mentor
│   ├── package.json      # Frontend package configuration
│   └── tsconfig.json     # TypeScript configuration
│
├── backend/              # Python FastAPI - Agent swarm & Socratic grading service
│   ├── app/
│   │   ├── config.py     # Configuration management (environment variables & settings)
│   │   ├── database.py   # SQLAlchemy session & database connection engine
│   │   ├── models.py     # SQLAlchemy DB Schemas (User, Thesis, ResearchPaper, SocraticDialog, ShadowThesis)
│   │   ├── schemas.py    # Pydantic validation schemas
│   │   ├── main.py       # FastAPI application initialization & middleware
│   │   ├── routers/
│   │   │   ├── auth.py   # User registration & login router
│   │   │   ├── thesis.py # Thesis creation, status, and paper fetching router
│   │   │   └── socratic.py # Socratic mentor dialog chat router
│   │   └── services/
│   │       ├── shadow_engine.py   # Autonomous background research agent (Semantic Scholar/arXiv mock)
│   │       └── socratic_mentor.py # Socratic steering logic comparing student drafts vs. Shadow ground-truth
│   ├── pyproject.toml    # Python project config managed by `uv`
│   └── .venv/            # Python virtual environment (fully created & pre-installed)
```

---

## Local Launch Instructions

Follow these quick commands to spin up Veritas AI on your local macOS machine (Mac Mini).

### 1. Launch the FastAPI Backend
The backend auto-initializes the database tables (SQLite fallback `veritas.db` for instant development, easily switchable to PostgreSQL) on start.

```bash
cd backend
# Activate the virtual environment
source .venv/bin/activate

# Run the FastAPI server
uvicorn app.main:app --port 8000 --reload
```
- **API Documentation**: Open [http://localhost:8000/docs](http://localhost:8000/docs) to view Swagger UI.
- **Health Check**: Open [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health).

### 2. Launch the Next.js Frontend
Go to the frontend directory and install dependencies (yarn v1 recommended for caching), then boot the development server.

```bash
cd frontend
# Install dependencies
yarn install

# Run the development server
yarn dev
```
- Open [http://localhost:3000](http://localhost:3000) to view the application workspace.

---

## Configuration & Environment Variables

Create a `.env` file in the `backend/` directory to customize API keys and Database connections:

```env
# Database connection string (defaults to SQLite local db if left blank)
DATABASE_URL=postgresql://user:password@localhost:5432/veritas

# LLM API Keys (for production agent swarms)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

Create a `.env.local` file in the `frontend/` directory to link the API endpoints:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Week 1 MVP Accomplishments & Architecture

1. **Brand Identity & Premium Design**: Custom glassmorphism, responsive split panels, high-end typography, dark mode slate palette (`globals.css`), and Outfit font (`layout.tsx`).
2. **Interactive Socratic Chat Workspace**: Split layout matching the NotebookLM aesthetic. Live paper indexes, dynamic suggestion pills, and Socratic mentor dialogue loops (`page.tsx`).
3. **Robust Backend API**: Full validation schemas (`schemas.py`), models mapping users, theses, papers, and shadow records (`models.py`), auto-instantiating tables (`main.py`).
4. **Autonomous Research Agents**: Set up the `shadow_engine.py` background worker and `socratic_mentor.py` steering logic that monitors student drafts for logical gaps.

---

## Production Deployment Prep

### Frontend (Vercel)
The Next.js frontend is fully optimized for Vercel:
1. Import this repository into Vercel.
2. Set environment variable `NEXT_PUBLIC_API_URL` pointing to your deployed backend.
3. Deploy!

### Backend (Vultr)
Deploy the FastAPI backend container using your $100 Vultr credits:
1. Set up a Vultr Ubuntu Compute instance.
2. Install Python, `uv`, and clone the repository.
3. Configure `systemd` or `supervisord` to daemonize the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
4. Map your domain name and set up an SSL certificate via Certbot (Let's Encrypt) and Nginx reverse proxy.
