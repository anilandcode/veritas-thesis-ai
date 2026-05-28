import json
import asyncio
from sqlalchemy.orm import Session
from app import models, schemas
import datetime
from app.services.prompt_gating import intercept_cheating_attempts

def compile_dynamic_socratic_context(thesis_id: int, thesis, active_section, db: Session) -> str:
    """
    Synthesizes a highly customized academic context explanation based on the thesis title,
    topic description, swarmed research papers, and verified claims.
    """
    papers_list = db.query(models.ResearchPaper).filter(models.ResearchPaper.thesis_id == thesis_id).all()
    claims_list = db.query(models.VerifiedClaim).filter(
        models.VerifiedClaim.thesis_id == thesis_id,
        models.VerifiedClaim.verification_status == "Verified"
    ).all()
    
    intro = (
        f"### 🦉 Topic Context & Literature Overview\n\n"
        f"Let's explore the academic context of your research topic: **\"{thesis.title}\"**.\n\n"
        f"Your study addresses a critical domain defined by: *{thesis.topic_description}*.\n\n"
    )
    
    lit_section = ""
    if papers_list:
        paper_citations = []
        for p in papers_list[:3]:
            author_surname = p.authors.split(",")[0].split(" ")[-1] if p.authors else "Scholar"
            paper_citations.append(f"- **\"{p.title}\"** ({author_surname}, {p.year or 2025}) — DOI: {p.doi or 'N/A'}")
        lit_section = (
            "**Key Academic Benchmarks (Swarmed Literature)**:\n"
            "According to the peer-reviewed sources harvested in your Literature Library, the academic consensus is anchored by:\n"
            + "\n".join(paper_citations) + "\n\n"
        )
    else:
        lit_section = (
            "**Key Academic Benchmarks**:\n"
            "We haven't indexed specific papers for this project yet. Once your Literature Library swarms new sources, "
            "they will form the academic backbone of your context here.\n\n"
        )
        
    claims_section = ""
    if claims_list:
        claim_items = []
        for c in claims_list[:2]:
            claim_items.append(f"- \"{c.claim_text}\"")
        claims_section = (
            "**Verified Scientific Claims**:\n"
            "Veritas has mapped and verified the following factual claims in these papers:\n"
            + "\n".join(claim_items) + "\n\n"
        )
        
    active_name = active_section.section_title if active_section else "Context & Relevance"
    hints_text = f"*{active_section.guiding_hints}*" if active_section else "Establish the broader domain of your topic."
    
    socratic_questions = (
        "**Socratic Pedagogical Framework**:\n"
        "To write a flawless introductory background, we guide you using the **Scope → Consensus → Tension** framework:\n"
        "1. *Scope (General Domain)*: Where does your topic sit in the broader field?\n"
        "2. *Consensus (Historical Context)*: What has been established by prior researchers?\n"
        "3. *Tension (Modern Shift)*: What recent observation or research gap challenges that baseline?\n\n"
        f"**Active Drafting Target**: **{active_name}**\n"
        f"Guideline: {hints_text}\n\n"
        "How do you plan to frame this transition? Which of the swarmed sources above do you feel best supports your planned argument?"
    )
    
    return intro + lit_section + claims_section + socratic_questions

def get_dynamic_socratic_suggestions(papers_list, active_section) -> list:
    suggestions = []
    if papers_list:
        first_author = papers_list[0].authors.split(",")[0].split(" ")[-1] if papers_list[0].authors else "Scholar"
        first_year = papers_list[0].year or 2025
        suggestions.append(f"How does {first_author} ({first_year}) support my case?")
    else:
        suggestions.append("How do I link research to my topic?")
        
    suggestions.append("What are the key findings of these papers?")
    
    if active_section:
        suggestions.append(f"Help me draft {active_section.section_title}")
    else:
        suggestions.append("Review my introduction outline")
        
    return suggestions

def generate_socratic_response(thesis_id: int, user_message: str, section: str, db: Session) -> schemas.SocraticChatResponse:
    # 1. Fetch thesis, shadow thesis, active drafting section, and previous chat history
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        raise ValueError("Thesis not found")
        
    shadow_thesis = db.query(models.ShadowThesis).filter(
        models.ShadowThesis.thesis_id == thesis_id,
        models.ShadowThesis.section == section
    ).first()
    
    # Standard fallback synthesis if none generated yet
    ground_truth = shadow_thesis.generated_text if shadow_thesis else "No shadow thesis compiled yet."
    
    # Fetch current active outline section currently in "Drafting" status
    active_section = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id,
        models.ThesisOutline.status == "Drafting"
    ).first()
    
    # Fetch dialog history
    history_models = db.query(models.SocraticDialog).filter(
        models.SocraticDialog.thesis_id == thesis_id,
        models.SocraticDialog.section == section
    ).order_by(models.SocraticDialog.created_at.asc()).all()
    
    # 2. Process user message and synthesize Socratic feedback
    # Save the user's message to the dialog history
    user_dialog = models.SocraticDialog(
        thesis_id=thesis_id,
        section=section,
        role="user",
        content=user_message
    )
    db.add(user_dialog)
    db.commit()
    
    # Run plagiarism similarity check on student chat message
    plag_report = {"highest_similarity": 0.0, "plagiarism_risk": "Low"}
    if len(user_message) > 30 and thesis.papers:
        from app.services.plagiarism_detector import check_text_similarity
        plag_report = check_text_similarity(user_message, thesis.papers)
        
    # Socratic response generation logic based on user input content and active section steering
    msg = user_message.lower()
    
    if plag_report["highest_similarity"] >= 0.60:
        response_text = (
            "I noticed that your draft shares a very high term similarity with one of our indexed papers "
            f"(\"{plag_report['matching_paper_title']}\"). Academic integrity is paramount in a thesis.\n\n"
            "Instead of copy-pasting verbatim text, how can you synthesize this core finding in your own words "
            "while properly citing it? Let's try rephrasing that concept together."
        )
        suggestions = [
            "Help me rewrite this in my own words",
            "How do I cite this paper properly?",
            "Show me the guidelines for direct quotes"
        ]
        if active_section:
            suggestions.append(f"Rewrite for {active_section.section_title}")
        grading = f"Verbatim Plagiarism Warning! Student pasted from paper: {plag_report['matching_paper_doi']} ({plag_report['highest_similarity'] * 100:.1f}% similarity)."
        
    elif plag_report["highest_similarity"] >= 0.30:
        response_text = (
            f"Your paragraph aligns closely with arguments in \"{plag_report['matching_paper_title']}\" "
            "but doesn't currently include a proper citation. Socratic writing requires grounding.\n\n"
            f"Can we integrate a formal citation for this paper (DOI: {plag_report['matching_paper_doi']}) to reinforce your draft?"
        )
        suggestions = [
            "Add citation for this source",
            "Help me rephrase to integrate the quote",
            "Review the rest of my text"
        ]
        grading = f"Moderate similarity overlap with paper {plag_report['matching_paper_doi']} ({plag_report['highest_similarity'] * 100:.1f}% similarity). Steering student to add proper academic citations."
        
    elif len(msg) < 15:
        if active_section:
            response_text = (
                f"I see you're working on the **{active_section.section_title}** section! "
                f"To build a strong foundation here, focus on the following guidelines:\n"
                f"*{active_section.guiding_hints}*\n\n"
                f"What is the first historical or technical detail you want to write to address this?"
            )
            suggestions = [
                f"Help me draft {active_section.section_title}",
                f"What should I include in {active_section.section_title}?",
                "What papers support this section?"
            ]
        else:
            response_text = (
                "I see you're getting started! A strong Introduction section begins by setting "
                "the broader context. What specific problem within your topic area do you think "
                "is the most urgent to address?"
            )
            suggestions = [
                "What is the core problem of this thesis?",
                "Who is affected by this problem?",
                "What are the traditional ways of solving it?"
            ]
        grading = "Student message is too short to evaluate. Steering them toward active section drafting."
        
    elif "outline" in msg or "start" in msg or "structure" in msg:
        outlines = db.query(models.ThesisOutline).filter(
            models.ThesisOutline.thesis_id == thesis_id
        ).order_by(models.ThesisOutline.id.asc()).all()
        
        if outlines:
            outline_str = "\n".join([
                f"- **{o.section_title}**: status={o.status}"
                for o in outlines
            ])
            active_str = f"You are currently drafting: **{active_section.section_title}**." if active_section else "All sections completed!"
            response_text = (
                f"Here is your active Socratic Outline status for '{thesis.title}':\n\n"
                f"{outline_str}\n\n"
                f"{active_str} Focus on addressing the guiding hints:\n"
                f"*{active_section.guiding_hints if active_section else ''}*"
            )
            suggestions = [
                f"How do I write {active_section.section_title}?" if active_section else "View final thesis",
                "Show me literature verified claims",
                "What is my next step?"
            ]
        else:
            response_text = (
                f"Let's outline your Introduction for '{thesis.title}'. Based on the verified research, "
                f"I recommend a 4-part structure:\n\n"
                f"1. **Context & Relevance**: Introduce the core domain and why it matters today.\n"
                f"2. **Problem Statement**: Explicitly declare the unresolved gap or issue.\n"
                f"3. **Research Objectives**: What will your thesis solve or explore?\n"
                f"4. **Significance**: How will your findings contribute to the field?\n\n"
                f"Where would you like to start? Let's draft your **Context & Relevance** first. "
                f"What is the first historical or current fact that grounds this study?"
            )
            suggestions = [
                "Draft the Context & Relevance section",
                "What are the core research objectives?",
                "Show me references for this outline"
            ]
        grading = "Outlining state. Socratic guide provided verified outline skeleton."
        
    elif any(k in msg for k in ["fact", "research", "reference", "source", "context", "explain", "theme", "finding", "literature"]):
        response_text = compile_dynamic_socratic_context(thesis_id, thesis, active_section, db)
        papers_list = db.query(models.ResearchPaper).filter(models.ResearchPaper.thesis_id == thesis_id).all()
        suggestions = get_dynamic_socratic_suggestions(papers_list, active_section)
        grading = f"Context synthesis for topic: '{thesis.title}'. Steered student using swarmed literature and verified claims."
        
    else:
        if active_section:
            response_text = (
                f"That's a very interesting thought regarding **{active_section.section_title}**. "
                f"Let's ground it. The guiding hints suggest: *{active_section.guiding_hints}*\n\n"
                f"How do you plan to justify the claim you just made in this section? "
                f"What evidence or authors support this viewpoint?"
            )
            suggestions = [
                f"How do I back this up for {active_section.section_title}?",
                "What claims have been verified by literature?",
                "Help me rephrase this for academic tone"
            ]
        else:
            response_text = (
                "That's a very interesting paragraph. You've introduced some key terms, but "
                "academic writing requires strong backing. How do you plan to justify the claim you "
                "just made? What evidence or authors have you read that support this viewpoint?"
            )
            suggestions = [
                "I want to back this up with citations",
                "How can I rephrase this for academic tone?",
                "Let's move to the Research Objectives"
            ]
        grading = f"Student draft: '{user_message[:60]}...'. Evaluated against active section: {active_section.section_key if active_section else 'None'}. Socratic prompt encourages justification."

    # Save the assistant's response to the dialog history
    assistant_dialog = models.SocraticDialog(
        thesis_id=thesis_id,
        section=section,
        role="assistant",
        content=response_text
    )
    db.add(assistant_dialog)
    db.commit()
    
    # Fetch updated history to return
    updated_history_models = db.query(models.SocraticDialog).filter(
        models.SocraticDialog.thesis_id == thesis_id,
        models.SocraticDialog.section == section
    ).order_by(models.SocraticDialog.created_at.asc()).all()
    
    history = [
        schemas.SocraticMessage(
            role=h.role,
            content=h.content,
            created_at=h.created_at
        ) for h in updated_history_models
    ]
    
    return schemas.SocraticChatResponse(
        response=response_text,
        history=history,
        suggestions=suggestions,
        grading_feedback=grading
    )


async def generate_socratic_stream(thesis_id: int, user_message: str, section: str, db: Session):
    """
    Asynchronous streaming generator mapping to active outline checkpoints.
    Yields data events emulating real-time text token flows.
    Specifically checks for bypassed/cheated command inputs and blocks shortcuts.
    """
    # 1. First run prompt bypass gating intercept
    bypass_prompt = intercept_cheating_attempts(user_message)
    
    if bypass_prompt:
        # Save user message to database history
        user_dialog = models.SocraticDialog(
            thesis_id=thesis_id,
            section=section,
            role="user",
            content=user_message
        )
        db.add(user_dialog)
        db.commit()
        
        # Save assistant bypass response to database
        assistant_dialog = models.SocraticDialog(
            thesis_id=thesis_id,
            section=section,
            role="assistant",
            content=bypass_prompt
        )
        db.add(assistant_dialog)
        db.commit()
        
        # Stream out bypass feedback
        words = bypass_prompt.split(" ")
        for i, w in enumerate(words):
            chunk = {
                "token": w + (" " if i < len(words) - 1 else ""),
                "suggestions": [
                    "Help me write in my own words",
                    "What claims are swarmed?",
                    "View active outline checklist"
                ],
                "grading_feedback": "Logical Gap Bypass Intercepted! Blocked passive shortcuts request."
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.01)
        return

    # 2. Fetch thesis details
    thesis = db.query(models.Thesis).filter(models.Thesis.id == thesis_id).first()
    if not thesis:
        yield f"data: {json.dumps({'error': 'Thesis not found'})}\n\n"
        return
        
    active_section = db.query(models.ThesisOutline).filter(
        models.ThesisOutline.thesis_id == thesis_id,
        models.ThesisOutline.status == "Drafting"
    ).first()
    
    # Save user message to database history
    user_dialog = models.SocraticDialog(
        thesis_id=thesis_id,
        section=section,
        role="user",
        content=user_message
    )
    db.add(user_dialog)
    db.commit()
    
    # Run plagiarism similarity check on student chat message
    plag_report = {"highest_similarity": 0.0, "plagiarism_risk": "Low"}
    if len(user_message) > 30 and thesis.papers:
        from app.services.plagiarism_detector import check_text_similarity
        plag_report = check_text_similarity(user_message, thesis.papers)
        
    # Generate Socratic responses based on standard state machine rules
    msg = user_message.lower()
    
    if plag_report["highest_similarity"] >= 0.60:
        response_text = (
            "I noticed that your draft shares a very high term similarity with one of our indexed papers "
            f"(\"{plag_report['matching_paper_title']}\"). Academic integrity is paramount in a thesis.\n\n"
            "Instead of copy-pasting verbatim text, how can you synthesize this core finding in your own words "
            "while properly citing it? Let's try rephrasing that concept together."
        )
        suggestions = [
            "Help me rewrite this in my own words",
            "How do I cite this paper properly?",
            "Show me the guidelines for direct quotes"
        ]
        if active_section:
            suggestions.append(f"Rewrite for {active_section.section_title}")
        grading = f"Verbatim Plagiarism Warning! Student pasted from paper: {plag_report['matching_paper_doi']} ({plag_report['highest_similarity'] * 100:.1f}% similarity)."
        
    elif plag_report["highest_similarity"] >= 0.30:
        response_text = (
            f"Your paragraph aligns closely with arguments in \"{plag_report['matching_paper_title']}\" "
            "but doesn't currently include a proper citation. Socratic writing requires grounding.\n\n"
            f"Can we integrate a formal citation for this paper (DOI: {plag_report['matching_paper_doi']}) to reinforce your draft?"
        )
        suggestions = [
            "Add citation for this source",
            "Help me rephrase to integrate the quote",
            "Review the rest of my text"
        ]
        grading = f"Moderate similarity overlap with paper {plag_report['matching_paper_doi']} ({plag_report['highest_similarity'] * 100:.1f}% similarity). Steering student to add proper academic citations."
        
    elif len(msg) < 15:
        if active_section:
            response_text = (
                f"I see you're working on the **{active_section.section_title}** section! "
                f"To build a strong foundation here, focus on the following guidelines:\n"
                f"*{active_section.guiding_hints}*\n\n"
                f"What is the first historical or technical detail you want to write to address this?"
            )
            suggestions = [
                f"Help me draft {active_section.section_title}",
                f"What should I include in {active_section.section_title}?",
                "What papers support this section?"
            ]
        else:
            response_text = (
                "I see you're getting started! A strong Introduction section begins by setting "
                "the broader context. What specific problem within your topic area do you think "
                "is the most urgent to address?"
            )
            suggestions = [
                "What is the core problem of this thesis?",
                "Who is affected by this problem?",
                "What are the traditional ways of solving it?"
            ]
        grading = "Student message is too short to evaluate. Steering them toward active section drafting."
        
    elif "outline" in msg or "start" in msg or "structure" in msg:
        outlines = db.query(models.ThesisOutline).filter(
            models.ThesisOutline.thesis_id == thesis_id
        ).order_by(models.ThesisOutline.id.asc()).all()
        
        if outlines:
            outline_str = "\n".join([
                f"- **{o.section_title}**: status={o.status}"
                for o in outlines
            ])
            active_str = f"You are currently drafting: **{active_section.section_title}**." if active_section else "All sections completed!"
            response_text = (
                f"Here is your active Socratic Outline status for '{thesis.title}':\n\n"
                f"{outline_str}\n\n"
                f"{active_str} Focus on addressing the guiding hints:\n"
                f"*{active_section.guiding_hints if active_section else ''}*"
            )
            suggestions = [
                f"How do I write {active_section.section_title}?" if active_section else "View final thesis",
                "Show me literature verified claims",
                "What is my next step?"
            ]
        else:
            response_text = (
                f"Let's outline your Introduction for '{thesis.title}'. Based on the verified research, "
                f"I recommend a 4-part structure:\n\n"
                f"1. **Context & Relevance**: Introduce the core domain and why it matters today.\n"
                f"2. **Problem Statement**: Explicitly declare the unresolved gap or issue.\n"
                f"3. **Research Objectives**: What will your thesis solve or explore?\n"
                f"4. **Significance**: How will your findings contribute to the field?\n\n"
                f"Where would you like to start? Let's draft your **Context & Relevance** first. "
                f"What is the first historical or current fact that grounds this study?"
            )
            suggestions = [
                "Draft the Context & Relevance section",
                "What are the core research objectives?",
                "Show me references for this outline"
            ]
        grading = "Outlining state. Socratic guide provided verified outline skeleton."
        
    elif any(k in msg for k in ["fact", "research", "reference", "source", "context", "explain", "theme", "finding", "literature"]):
        response_text = compile_dynamic_socratic_context(thesis_id, thesis, active_section, db)
        papers_list = db.query(models.ResearchPaper).filter(models.ResearchPaper.thesis_id == thesis_id).all()
        suggestions = get_dynamic_socratic_suggestions(papers_list, active_section)
        grading = f"Context synthesis for topic: '{thesis.title}'. Steered student using swarmed literature and verified claims."
        
    else:
        if active_section:
            response_text = (
                f"That's a very interesting thought regarding **{active_section.section_title}**. "
                f"Let's ground it. The guiding hints suggest: *{active_section.guiding_hints}*\n\n"
                f"How do you plan to justify the claim you just made in this section? "
                f"What evidence or authors support this viewpoint?"
            )
            suggestions = [
                f"How do I back this up for {active_section.section_title}?",
                "What claims have been verified by literature?",
                "Help me rephrase this for academic tone"
            ]
        else:
            response_text = (
                "That's a very interesting paragraph. You've introduced some key terms, but "
                "academic writing requires strong backing. How do you plan to justify the claim you "
                "just made? What evidence or authors have you read that support this viewpoint?"
            )
            suggestions = [
                "I want to back this up with citations",
                "How can I rephrase this for academic tone?",
                "Let's move to the Research Objectives"
            ]
        grading = f"Student draft: '{user_message[:60]}...'. Evaluated against active section: {active_section.section_key if active_section else 'None'}. Socratic prompt encourages justification."

    # Save the assistant's response to the database history
    assistant_dialog = models.SocraticDialog(
        thesis_id=thesis_id,
        section=section,
        role="assistant",
        content=response_text
    )
    db.add(assistant_dialog)
    db.commit()
    
    # Stream tokens word-by-word
    words = response_text.split(" ")
    for i, w in enumerate(words):
        chunk = {
            "token": w + (" " if i < len(words) - 1 else ""),
            "suggestions": suggestions,
            "grading_feedback": grading
        }
        yield f"data: {json.dumps(chunk)}\n\n"
        await asyncio.sleep(0.015) # Organic typewriter stream pace
