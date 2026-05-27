from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas, models
from app.services.socratic_mentor import generate_socratic_response, generate_socratic_stream
from app.routers.dependencies import get_current_user

router = APIRouter(prefix="/socratic", tags=["Socratic Mentor"])

@router.post("/chat")
async def socratic_chat(
    chat_in: schemas.SocraticChatInput, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify ownership of the thesis first
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == chat_in.thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found or unauthorized access"
        )
        
    try:
        if chat_in.stream:
            # Server-Sent Events streaming flow
            generator = generate_socratic_stream(
                thesis_id=chat_in.thesis_id,
                user_message=chat_in.message,
                section=chat_in.section or "Introduction",
                db=db
            )
            return StreamingResponse(generator, media_type="text/event-stream")
        else:
            # Traditional synchronous feedback flow
            response = generate_socratic_response(
                thesis_id=chat_in.thesis_id,
                user_message=chat_in.message,
                section=chat_in.section or "Introduction",
                db=db
            )
            return response
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Socratic interaction error: {str(e)}")


@router.post("/refine-scope", response_model=schemas.ScopeRefinementOut)
def refine_scope(
    scope_in: schemas.ScopeRefinementIn,
    current_user: models.User = Depends(get_current_user)
):
    """
    Socratic AI Pre-Scoping Guide:
    Analyzes the working title and description, returning an academically optimized title,
    an expanded problem statement, and 3 focused research questions to prevent token waste
    during the subsequent concurrent search swarms.
    """
    t = scope_in.title.strip()
    d = scope_in.topic_description.strip()
    
    # NLP-driven high-end Socratic scoping expansion
    refined_title = t
    if not any(t.lower().startswith(prefix) for prefix in ["an ", "a ", "empirical", "critical", "investigating"]):
        refined_title = f"A Socratic Inquiry into {t}"
    
    if len(refined_title) < 25:
        refined_title = f"Optimizing {refined_title} through Socratic Learning Architectures"
        
    refined_problem = (
        f"Contemporary approaches to '{d}' are often constrained by passive information retrieval patterns. "
        "By lacking active Socratic steering, research scoping in this domain risks logical gaps "
        "and unverified claims. This study establishes a rigorous, literature-backed conceptual canvas "
        "to synthesize foundational claims while preserving absolute authorship integrity."
    )
    
    suggested_questions = [
        f"How does Socratic active steering optimize the logical coherence and depth of '{t}'?",
        f"What are the foundational literature benchmarks and retractions that gate empirical research in '{t}'?",
        f"In what ways does a traceable synthesis ledger protect student authorship integrity when exploring '{t}'?"
    ]
    
    return {
        "refined_title": refined_title,
        "refined_problem": refined_problem,
        "suggested_questions": suggested_questions
    }

