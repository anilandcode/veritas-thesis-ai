from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.services.shadow_engine import trigger_shadow_thesis_generation
from app.routers.dependencies import get_current_user

router = APIRouter(prefix="/thesis", tags=["Theses"])

@router.post("/create", response_model=schemas.ThesisOut)
def create_thesis(
    thesis_in: schemas.ThesisCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    new_thesis = models.Thesis(
        user_id=current_user.id,
        title=thesis_in.title,
        topic_description=thesis_in.topic_description,
        status="Generating Shadow"
    )
    db.add(new_thesis)
    db.commit()
    db.refresh(new_thesis)
    
    # Trigger Shadow Thesis Generation in the background!
    background_tasks.add_task(
        trigger_shadow_thesis_generation,
        new_thesis.id,
        db
    )
    
    return new_thesis

@router.get("/{thesis_id}", response_model=schemas.ThesisOut)
def get_thesis(
    thesis_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
    return thesis

@router.get("/{thesis_id}/papers", response_model=List[schemas.ResearchPaperOut])
def get_thesis_papers(
    thesis_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
    return thesis.papers

@router.get("/{thesis_id}/shadow", response_model=List[schemas.ShadowThesisOut])
def get_shadow_theses(
    thesis_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
    return thesis.shadow_theses

@router.get("/{thesis_id}/claims", response_model=List[schemas.VerifiedClaimOut])
def get_verified_claims(
    thesis_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
    return thesis.verified_claims

@router.post("/{thesis_id}/verify-draft", response_model=schemas.DraftVerificationOut)
def verify_draft_plagiarism(
    thesis_id: int,
    draft_in: schemas.DraftVerificationIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from app.services.plagiarism_detector import check_text_similarity
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
    report = check_text_similarity(draft_in.text, thesis.papers)
    return report

@router.get("/{thesis_id}/outline", response_model=List[schemas.ThesisOutlineOut])
def get_thesis_outline(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
        
    # Safeguard autoprovisioning if outline table is empty
    if not thesis.outlines:
        from app.services.outline_generator import generate_and_cache_outline
        return generate_and_cache_outline(thesis_id, db)
        
    return db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id
    ).order_by(models.ThesisOutline.id.asc()).all()

@router.post("/{thesis_id}/outline/save", response_model=List[schemas.ThesisOutlineOut])
def save_section_draft(
    thesis_id: int,
    update_in: schemas.OutlineTextUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
        
    outline_item = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id,
        models.ThesisOutline.section_key == update_in.section_key
    ).first()
    
    if not outline_item:
        raise HTTPException(status_code=404, detail="Section not found in outline")
        
    if outline_item.status == "Locked":
        raise HTTPException(status_code=400, detail="Cannot edit a locked outline section")
        
    outline_item.draft_text = update_in.text
    db.commit()
    
    # Hook: Log "save_draft" in the immutable ledger
    try:
        from app.services.ledger_service import log_ledger_entry
        from app.services.plagiarism_detector import check_text_similarity, tokenize
        
        plag_idx = 0.0
        if len(update_in.text) > 30 and thesis.papers:
            plag_report = check_text_similarity(update_in.text, thesis.papers)
            plag_idx = plag_report.get("highest_similarity", 0.0)
            
        draft_tokens = set(tokenize(update_in.text))
        verified_claims = db.query(models.VerifiedClaim).filter(
            models.VerifiedClaim.thesis_id == thesis_id,
            models.VerifiedClaim.verification_status == "Verified"
        ).all()
        claims_tokens = set()
        for c in verified_claims:
            claims_tokens.update(tokenize(c.claim_text))
        overlap = draft_tokens & claims_tokens
        
        log_ledger_entry(
            thesis_id=thesis_id,
            section_key=update_in.section_key,
            action="save_draft",
            draft_text=update_in.text,
            plagiarism_index=plag_idx,
            synthesis_count=len(overlap),
            db=db
        )
    except Exception as e:
        print(f"[Ledger Autosave Hook Error]: {str(e)}")
        
    return db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id
    ).order_by(models.ThesisOutline.id.asc()).all()

@router.post("/{thesis_id}/outline/unlock-next", response_model=schemas.SectionUnlockResponse)
def unlock_next_outline_section(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Thesis not found or unauthorized access"
        )
        
    # Get active outline section currently in "Drafting" status
    active_section = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id,
        models.ThesisOutline.status == "Drafting"
    ).first()
    
    if not active_section:
        raise HTTPException(status_code=400, detail="No active section currently being drafted")
        
    # 1. Draft Length Check
    draft_length = len(active_section.draft_text.strip())
    if draft_length < 100:
        try:
            from app.services.ledger_service import log_ledger_entry
            log_ledger_entry(
                thesis_id=thesis_id,
                section_key=active_section.section_key,
                action="audit_failure",
                draft_text=active_section.draft_text,
                plagiarism_index=0.0,
                synthesis_count=0,
                db=db
            )
        except Exception as e:
            print(f"[Ledger Audit Fail Hook Error]: {str(e)}")
            
        raise HTTPException(
            status_code=400,
            detail=f"Socratic Audit: Your draft for '{active_section.section_title}' must be at least 100 characters to verify academic depth."
        )
        
    # 2. VSM Plagiarism verification check
    from app.services.plagiarism_detector import check_text_similarity
    plag_report = check_text_similarity(active_section.draft_text, thesis.papers)
    if plag_report["highest_similarity"] >= 0.60:
        try:
            from app.services.ledger_service import log_ledger_entry
            log_ledger_entry(
                thesis_id=thesis_id,
                section_key=active_section.section_key,
                action="audit_failure",
                draft_text=active_section.draft_text,
                plagiarism_index=plag_report["highest_similarity"],
                synthesis_count=0,
                db=db
            )
        except Exception as e:
            print(f"[Ledger Audit Fail Hook Error]: {str(e)}")
            
        raise HTTPException(
            status_code=400,
            detail=f"Socratic Audit: High plagiarism overlap ({plag_report['highest_similarity'] * 100:.1f}%) detected with paper '{plag_report['matching_paper_title']}'. Please rephrase and write original text."
        )
        
    # 3. Technical Synthesis keyword overlap check
    # Student must incorporate at least 2 technical terms from the swarmed claims
    from app.services.plagiarism_detector import tokenize
    draft_tokens = set(tokenize(active_section.draft_text))
    
    verified_claims = db.query(models.VerifiedClaim).filter(
        models.VerifiedClaim.thesis_id == thesis_id,
        models.VerifiedClaim.verification_status == "Verified"
    ).all()
    
    claims_tokens = set()
    for c in verified_claims:
        claims_tokens.update(tokenize(c.claim_text))
        
    overlap = draft_tokens & claims_tokens
    if len(overlap) < 2 and verified_claims:
        try:
            from app.services.ledger_service import log_ledger_entry
            log_ledger_entry(
                thesis_id=thesis_id,
                section_key=active_section.section_key,
                action="audit_failure",
                draft_text=active_section.draft_text,
                plagiarism_index=plag_report.get("highest_similarity", 0.0),
                synthesis_count=len(overlap),
                db=db
            )
        except Exception as e:
            print(f"[Ledger Audit Fail Hook Error]: {str(e)}")
            
        raise HTTPException(
            status_code=400,
            detail=f"Socratic Audit: Your draft does not incorporate core technical findings from literature. Try referencing themes like: {list(claims_tokens)[:6]}."
        )
        
    # Hook: Log successful section unlock in the immutable ledger
    try:
        from app.services.ledger_service import log_ledger_entry
        log_ledger_entry(
            thesis_id=thesis_id,
            section_key=active_section.section_key,
            action="unlock_section",
            draft_text=active_section.draft_text,
            plagiarism_index=plag_report.get("highest_similarity", 0.0),
            synthesis_count=len(overlap),
            db=db
        )
    except Exception as e:
        print(f"[Ledger Unlock Hook Error]: {str(e)}")
        
    # 4. Transition statuses: Lock Section completed and unlock the next section
    active_section.status = "Completed"
    
    # Get all outline elements sorted to find the next section
    all_outlines = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id
    ).order_by(models.ThesisOutline.id.asc()).all()
    
    next_section = None
    active_idx = all_outlines.index(active_section)
    if active_idx + 1 < len(all_outlines):
        next_section = all_outlines[active_idx + 1]
        next_section.status = "Drafting"
        
    # 5. Inject Congratulations & opening Socratic prompt in chat conversation logs
    welcome_text = (
        f"✓ Socratic Audit Passed for **{active_section.section_title}**!\n\n"
        "Your synthesis is highly original and incorporates verified literature claims.\n\n"
    )
    if next_section:
        welcome_text += (
            f"Let's write Section: **{next_section.section_title}**.\n\n"
            f"Guidance hints: {next_section.guiding_hints}\n\n"
            "What specific challenges or research aspects do you want to explore here?"
        )
    else:
        welcome_text += (
            "Congratulations, Graduate Scholar! You have successfully completed active Socratic steering and drafted all sections of your Introduction!"
        )
        
    socratic_dialog = models.SocraticDialog(
        thesis_id=thesis_id,
        section="Introduction",
        role="assistant",
        content=welcome_text
    )
    db.add(socratic_dialog)
    db.commit()
    
    # Reload outline list
    outline_list = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id
    ).order_by(models.ThesisOutline.id.asc()).all()
    
    return schemas.SectionUnlockResponse(
        success=True,
        message=welcome_text,
        unlocked_section_key=next_section.section_key if next_section else None,
        outline=outline_list
    )

@router.get("/verify-certificate/{sig_code:path}", response_model=schemas.SupervisorVerificationReport)
def verify_authorship_certificate(
    sig_code: str,
    db: Session = Depends(get_db)
):
    """
    Public verification endpoint matching a copy-proof progress signature certificate.
    Returns complete student identity, outline documents, and chronological audit trails.
    """
    # Retrieve the ledger item matching the exact signature code
    ledger_item = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.verification_sig == sig_code
    ).first()
    
    if not ledger_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Verification Certificate not found. Check the certificate spelling."
        )
        
    # Get associated thesis details
    thesis = db.query(models.Thesis).filter(models.Thesis.id == ledger_item.thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis associated with certificate not found")
        
    # Fetch all ledger timeline logs for this thesis, ordered chronologically
    timeline = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id
    ).order_by(models.AuthorshipLedger.id.asc()).all()
    
    # Fetch outline items
    outline = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis.id
    ).order_by(models.ThesisOutline.id.asc()).all()
    
    return schemas.SupervisorVerificationReport(
        student_email=thesis.user.email,
        thesis_title=thesis.title,
        topic_description=thesis.topic_description,
        section_key=ledger_item.section_key,
        verification_sig=sig_code,
        timeline=timeline,
        outline=outline
    )

@router.get("/supervisor/students", response_model=schemas.SupervisorCohortReport)
def get_supervisor_cohort_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supervisor endpoint to fetch all student progress summaries under their direction,
    along with institutional analytics aggregates.
    """
    if not current_user.is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only supervisors are authorized to view cohort dashboards."
        )
        
    theses = db.query(models.Thesis).filter(
        models.Thesis.supervisor_email == current_user.email
    ).all()
    
    student_summaries = []
    total_plagiarism = 0.0
    total_interactions = 0
    total_unlocks = 0
    
    for thesis in theses:
        outline = db.query(models.ThesisOutline).filter(
            models.ThesisOutline.thesis_id == thesis.id
        ).order_by(models.ThesisOutline.id.asc()).all()
        
        timeline = db.query(models.AuthorshipLedger).filter(
            models.AuthorshipLedger.thesis_id == thesis.id
        ).order_by(models.AuthorshipLedger.id.asc()).all()
        
        plag_scores = [log.plagiarism_index for log in timeline if log.action in ("save_draft", "unlock_section")]
        highest_plag = max(plag_scores) if plag_scores else 0.0
        
        verified_claims = db.query(models.VerifiedClaim).filter(
            models.VerifiedClaim.thesis_id == thesis.id,
            models.VerifiedClaim.verification_status == "Verified"
        ).all()
        total_claims_count = len(verified_claims)
        
        unlocks_logs = [log for log in timeline if log.action == "unlock_section"]
        latest_synthesis = unlocks_logs[-1].synthesis_count if unlocks_logs else 0
        synthesis_pct = (latest_synthesis / total_claims_count) * 100.0 if (total_claims_count > 0 and latest_synthesis > 0) else 0.0
        
        chat_bubbles_count = db.query(models.SocraticDialog).filter(
            models.SocraticDialog.thesis_id == thesis.id
        ).count()
        
        latest_sig = timeline[-1].verification_sig if timeline else f"VERITAS-AUTH-SIG-PENDING-{thesis.id}"
        
        summary = schemas.StudentProgressSummary(
            thesis_id=thesis.id,
            student_email=thesis.user.email,
            student_name=thesis.user.full_name or thesis.user.email.split("@")[0].capitalize(),
            thesis_title=thesis.title,
            topic_description=thesis.topic_description,
            current_section=thesis.current_section,
            status=thesis.status,
            plagiarism_index=highest_plag,
            synthesis_percentage=synthesis_pct,
            interaction_count=chat_bubbles_count,
            verification_sig=latest_sig,
            outline=outline,
            timeline=timeline
        )
        student_summaries.append(summary)
        
        total_plagiarism += highest_plag
        total_interactions += chat_bubbles_count
        total_unlocks += len(unlocks_logs)
        
    avg_integrity = (100.0 - (total_plagiarism / len(theses) * 100.0)) if theses else 100.0
    
    return schemas.SupervisorCohortReport(
        students=student_summaries,
        average_integrity=avg_integrity,
        total_interactions=total_interactions,
        unlocks_cleared=total_unlocks
    )

@router.post("/supervisor/invite", response_model=schemas.StudentProgressSummary)
def invite_cohort_student(
    invite_in: schemas.SupervisorInviteInput,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supervisor endpoint to invite a new student to a cohort, auto-seeding their thesis,
    mapping supervisor email, and initiating background swarmed academic research.
    """
    if not current_user.is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: Only supervisors are authorized to invite cohort students."
        )
        
    student = db.query(models.User).filter(models.User.email == invite_in.student_email).first()
    if not student:
        student = models.User(
            email=invite_in.student_email,
            hashed_password="temporary_student_password",
            full_name=invite_in.student_email.split("@")[0].capitalize(),
            is_supervisor=False
        )
        db.add(student)
        db.commit()
        db.refresh(student)
        
    new_thesis = models.Thesis(
        user_id=student.id,
        title=invite_in.thesis_title,
        topic_description=invite_in.topic_description,
        supervisor_email=current_user.email,
        status="Generating Shadow"
    )
    db.add(new_thesis)
    db.commit()
    db.refresh(new_thesis)
    
    background_tasks.add_task(
        trigger_shadow_thesis_generation,
        new_thesis.id,
        db
    )
    
    return schemas.StudentProgressSummary(
        thesis_id=new_thesis.id,
        student_email=student.email,
        student_name=student.full_name,
        thesis_title=new_thesis.title,
        topic_description=new_thesis.topic_description,
        current_section="Introduction",
        status="Generating Shadow",
        plagiarism_index=0.0,
        synthesis_percentage=0.0,
        interaction_count=0,
        verification_sig=f"VERITAS-AUTH-SIG-PENDING-{new_thesis.id}",
        outline=[],
        timeline=[]
    )


@router.get("/{thesis_id}/export", response_model=schemas.ThesisExportReport)
def export_thesis_report(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Compiles all active segments, audits AuthorshipLedger log parameters, 
    and fetches verified signature certificates to return a structured export payload.
    """
    thesis = db.query(models.Thesis).filter(
        models.Thesis.id == thesis_id,
        models.Thesis.user_id == current_user.id
    ).first()
    if not thesis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Thesis not found or unauthorized access"
        )
        
    if thesis.administrative_hold:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Graduation export is gated by Dean's administrative hold. Please contact your department office."
        )
        
    outlines = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis.id
    ).order_by(models.ThesisOutline.id.asc()).all()
    
    compiled_sections = []
    for outline in outlines:
        draft = outline.draft_text or ""
        compiled_sections.append(f"# {outline.section_title}\n\n{draft}")
    compiled_markdown = "\n\n".join(compiled_sections)
    
    is_fully_completed = len(outlines) > 0 and all(outline.status == "Completed" for outline in outlines)
    
    timeline = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id
    ).order_by(models.AuthorshipLedger.id.asc()).all()
    
    latest_sig = timeline[-1].verification_sig if timeline else f"VERITAS-AUTH-SIG-PENDING-{thesis.id}"
    
    saves_count = db.query(models.AuthorshipLedger).filter(
        models.AuthorshipLedger.thesis_id == thesis.id,
        models.AuthorshipLedger.action == "save_draft"
    ).count()
    
    plag_scores = [log.plagiarism_index for log in timeline if log.action in ("save_draft", "unlock_section")]
    highest_plag = max(plag_scores) if plag_scores else 0.0
    integrity_score = max(0.0, 100.0 - (highest_plag * 100.0))
    
    interaction_count = db.query(models.SocraticDialog).filter(
        models.SocraticDialog.thesis_id == thesis.id
    ).count()
    
    advisor_name = None
    if thesis.supervisor_email:
        supervisor = db.query(models.User).filter(models.User.email == thesis.supervisor_email).first()
        if supervisor:
            advisor_name = supervisor.full_name or supervisor.email.split("@")[0].capitalize()
        else:
            advisor_name = thesis.supervisor_email.split("@")[0].capitalize()
            
    student_name = thesis.user.full_name or thesis.user.email.split("@")[0].capitalize()
    
    comments = db.query(models.SupervisorComment).filter(
        models.SupervisorComment.thesis_id == thesis.id
    ).all()
    total_comments_count = len(comments)
    resolved_comments_count = len([c for c in comments if c.is_resolved])

    return schemas.ThesisExportReport(
        title=thesis.title,
        student_name=student_name,
        student_email=thesis.user.email,
        advisor_name=advisor_name,
        topic_description=thesis.topic_description,
        compiled_markdown=compiled_markdown,
        references=thesis.papers,
        verification_sig=latest_sig,
        saves_count=saves_count,
        integrity_score=integrity_score,
        interaction_count=interaction_count,
        is_fully_completed=is_fully_completed,
        resolved_comments_count=resolved_comments_count,
        total_comments_count=total_comments_count
    )


@router.post("/{thesis_id}/comments", response_model=schemas.SupervisorCommentOut)
def create_supervisor_comment(
    thesis_id: int,
    comment_in: schemas.SupervisorCommentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Faculty Supervisor endpoint to drop a Socratic feedback annotation comment.
    """
    if not current_user.is_supervisor:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only supervisors are authorized to comment."
          )
          
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
          
    if thesis.supervisor_email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to comment on this student's thesis."
        )
          
    new_comment = models.SupervisorComment(
        thesis_id=thesis_id,
        section_key=comment_in.section_key,
        highlighted_quote=comment_in.highlighted_quote,
        comment_text=comment_in.comment_text,
        is_resolved=False
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


@router.get("/{thesis_id}/comments", response_model=List[schemas.SupervisorCommentOut])
def get_thesis_comments(
    thesis_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Fetch all supervisor Socratic comments for a specific thesis.
    """
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis not found")
          
    # Ensure either the student who owns it OR the supervisor accesses it
    if thesis.user_id != current_user.id and (not current_user.is_supervisor or thesis.supervisor_email != current_user.email):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to thesis comments."
        )
          
    comments = db.query(models.SupervisorComment).filter(
        models.SupervisorComment.thesis_id == thesis_id
    ).order_by(models.SupervisorComment.id.asc()).all()
    return comments


@router.post("/comments/{comment_id}/resolve", response_model=schemas.SupervisorCommentOut)
def resolve_supervisor_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Student endpoint to resolve an advisor's Socratic comment.
    """
    comment = db.query(models.SupervisorComment).filter(models.SupervisorComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
          
    thesis = db.query(models.Thesis).filter(models.Thesis.id == comment.thesis_id).first()
    if not thesis:
        raise HTTPException(status_code=404, detail="Thesis associated with comment not found")
          
    if thesis.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the student candidate can resolve supervisor comments."
        )
          
    comment.is_resolved = True
    db.commit()
    db.refresh(comment)
    return comment







