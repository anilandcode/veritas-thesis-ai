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
