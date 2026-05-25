from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.routers.dependencies import get_current_user
from app import models, schemas

router = APIRouter(
    prefix="/admin",
    tags=["Dean Administration"]
)

@router.get("/analytics", response_model=schemas.DepartmentAnalyticsOut)
def get_departmental_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Computes real-time, institution-wide metrics including average originality index,
    active advisor licensing pools, unlocked milestones ratio, and total theses active.
    """
    if not current_user.is_dean:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated program deans are authorized to inspect departmental analytics."
        )
    if not current_user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dean is not allocated to any department."
        )
        
    # Get all students in the dean's department
    students = db.query(models.User).filter(
        models.User.department_id == current_user.department_id,
        models.User.is_dean == False,
        models.User.is_supervisor == False
    ).all()
    
    student_ids = [s.id for s in students]
    total_theses = db.query(models.Thesis).filter(models.Thesis.user_id.in_(student_ids)).count() if student_ids else 0
    active_students_count = len(students)
    
    total_originality = 0.0
    total_dialogs = 0
    total_milestones = 0
    total_completed_milestones = 0
    
    theses = db.query(models.Thesis).filter(models.Thesis.user_id.in_(student_ids)).all() if student_ids else []
    for thesis in theses:
        # Load active outlines completion
        outlines = db.query(models.ThesisOutline).filter(models.ThesisOutline.thesis_id == thesis.id).all()
        total_milestones += len(outlines)
        total_completed_milestones += len([o for o in outlines if o.status == "Completed"])
        
        # Calculate originality from AuthorshipLedger logs
        timeline = db.query(models.AuthorshipLedger).filter(models.AuthorshipLedger.thesis_id == thesis.id).all()
        plag_scores = [log.plagiarism_index for log in timeline if log.action in ("save_draft", "unlock_section")]
        highest_plag = max(plag_scores) if plag_scores else 0.0
        integrity_score = max(0.0, 100.0 - (highest_plag * 100.0))
        total_originality += integrity_score
        
        # Socratic dialogue count
        dialogs_count = db.query(models.SocraticDialog).filter(models.SocraticDialog.thesis_id == thesis.id).count()
        total_dialogs += dialogs_count
        
    avg_originality = (total_originality / len(theses)) if theses else 100.0
    avg_dialogs = (total_dialogs / len(theses)) if theses else 0.0
    milestones_ratio = (total_completed_milestones / total_milestones) if total_milestones else 1.0
    
    # Advisor licenses
    advisors_count = db.query(models.User).filter(
        models.User.department_id == current_user.department_id,
        models.User.is_supervisor == True
    ).count()
    
    return schemas.DepartmentAnalyticsOut(
        active_students_count=active_students_count,
        average_originality_index=avg_originality,
        average_socratic_dialogs=avg_dialogs,
        unlocked_milestones_ratio=milestones_ratio * 100.0,
        active_advisor_licenses_count=advisors_count,
        total_theses=total_theses
    )

@router.post("/supervisors/{user_id}/approve")
def approve_supervisor_license(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_dean:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated deans can authorize supervisor licensing pools."
        )
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    target_user.is_supervisor = True
    db.commit()
    return {"message": "Supervisor license approved successfully", "user_id": user_id}

@router.post("/theses/{thesis_id}/hold", response_model=schemas.DeanHoldToggle)
def toggle_administrative_hold(
    thesis_id: int,
    payload: schemas.DeanHoldToggle,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.is_dean:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only authenticated deans can toggle administrative holds."
        )
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
    thesis.administrative_hold = payload.administrative_hold
    db.commit()
    return schemas.DeanHoldToggle(administrative_hold=thesis.administrative_hold)

@router.post("/institutions", response_model=schemas.InstitutionOut)
def register_institution(
    name: str,
    domain: str,
    db: Session = Depends(get_db)
):
    inst = models.Institution(name=name, domain=domain)
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst
