from sqlalchemy.orm import Session
from app import models
from typing import List

def generate_and_cache_outline(thesis_id: int, db: Session) -> List[models.ThesisOutline]:
    """
    Creates and stores the 4 core Socratic sections for a newly generated thesis.
    Unlocks Section 1 (Context & Relevance) by default; locks all others.
    Pre-fills sections with targeted guiding hints.
    """
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        return []
        
    # Check if outline already exists for this thesis
    existing = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id
    ).first()
    if existing:
        return db.query(models.ThesisOutline).filter(
            models.ThesisOutline.thesis_id == thesis_id
        ).order_by(models.ThesisOutline.id.asc()).all()
        
    print(f"[Outline Generator] Constructing structured Socratic checklist for thesis {thesis_id}...")
    
    # Pre-parse papers or verified claims to build context-aware guiding hints
    verified_claims = db.query(models.VerifiedClaim).filter(
        models.VerifiedClaim.thesis_id == thesis_id,
        models.VerifiedClaim.verification_status == "Verified"
    ).all()
    
    claims_text = "; ".join([c.claim_text for c in verified_claims]) if verified_claims else "Socratic active learning steering"
    
    # 4 Core Sections definitions
    outline_data = [
        {
            "section_title": "Context & Relevance",
            "section_key": "context",
            "guiding_hints": (
                f"Establish the broader domain of '{thesis.title}'. "
                "Synthesize historical and modern active learning theories. "
                f"Identify verified benchmarks: {claims_text[:120]}..."
            ),
            "status": "Drafting", # First section unlocked by default!
        },
        {
            "section_title": "Problem Statement",
            "section_key": "problem",
            "guiding_hints": (
                f"Examine the core limitations in '{thesis.topic_description[:100]}...'. "
                "Explicitly declare the critical gap (e.g. passive retrieval systems vs student authorship). "
                "Outline why traditional AI assistance creates plagiarism and learning integrity risks."
            ),
            "status": "Locked",
        },
        {
            "section_title": "Research Objectives",
            "section_key": "objectives",
            "guiding_hints": (
                "Formulate 2-3 precise research questions. "
                "Define parameters to evaluate Socratic tutoring effectiveness, active steerability limits, "
                "and academic verification frameworks."
            ),
            "status": "Locked",
        },
        {
            "section_title": "Significance of Study",
            "section_key": "significance",
            "guiding_hints": (
                "Argue the clinical and educational value of your findings. "
                "Explain how this method drops academic plagiarism and builds canvas/LMS pilot certificates. "
                "Discuss long-term impact on grading frameworks."
            ),
            "status": "Locked",
        }
    ]
    
    cached_records = []
    for data in outline_data:
        record = models.ThesisOutline(
            thesis_id=thesis_id,
            section_title=data["section_title"],
            section_key=data["section_key"],
            guiding_hints=data["guiding_hints"],
            status=data["status"],
            draft_text=""
        )
        db.add(record)
        cached_records.append(record)
        
    db.commit()
    print(f"[Outline Generator] Successfully pre-seeded and cached {len(cached_records)} outline elements.")
    return cached_records
