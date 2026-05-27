from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    is_supervisor: bool
    is_dean: bool = False
    institution_id: Optional[int] = None
    department_id: Optional[int] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# Thesis Schemas
class ThesisBase(BaseModel):
    title: str
    topic_description: str

class ThesisCreate(ThesisBase):
    pass

class ThesisOut(ThesisBase):
    id: int
    user_id: int
    current_section: str
    status: str
    supervisor_email: Optional[str] = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Research Paper Schemas
class ResearchPaperOut(BaseModel):
    id: int
    thesis_id: int
    title: str
    authors: Optional[str] = None
    journal: Optional[str] = None
    year: Optional[int] = None
    doi: Optional[str] = None
    abstract: Optional[str] = None
    url: Optional[str] = None
    confidence_level: float
    citation_count: int
    is_retracted: bool = False
    retraction_details: Optional[str] = None
    licence: Optional[str] = None

    class Config:
        from_attributes = True

# Socratic Chat Schemas
class SocraticChatInput(BaseModel):
    thesis_id: int
    message: str
    section: Optional[str] = "Introduction"
    stream: Optional[bool] = False

class SocraticMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SocraticChatResponse(BaseModel):
    response: str
    history: List[SocraticMessage]
    suggestions: List[str]  # 2-3 target Socratic questions/hints
    grading_feedback: Optional[str] = None  # AI's evaluation against Shadow Thesis (optional for user)

# Shadow Thesis Schemas
class ShadowThesisOut(BaseModel):
    id: int
    thesis_id: int
    section: str
    generated_text: str
    confidence_score: float
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# Verified Claim Schemas
class VerifiedClaimOut(BaseModel):
    id: int
    thesis_id: int
    section: str
    claim_text: str
    supporting_dois: str
    confidence_score: float
    verification_status: str
    plagiarism_index: float
    plagiarism_status: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class DraftVerificationIn(BaseModel):
    text: str

class DraftVerificationOut(BaseModel):
    highest_similarity: float
    matching_paper_title: Optional[str] = None
    matching_paper_doi: Optional[str] = None
    plagiarism_risk: str


# Thesis Outline Schemas
class ThesisOutlineOut(BaseModel):
    id: int
    thesis_id: int
    section_title: str
    section_key: str
    guiding_hints: Optional[str] = None
    status: str
    draft_text: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class OutlineTextUpdate(BaseModel):
    section_key: str
    text: str

class SectionUnlockResponse(BaseModel):
    success: bool
    message: str
    unlocked_section_key: Optional[str] = None
    outline: List[ThesisOutlineOut]


# Healthcheck Schema
class HealthCheckOut(BaseModel):
    status: str
    database: str
    version: str

# Supervisor Verification Schemas
class AuthorshipLedgerOut(BaseModel):
    id: int
    thesis_id: int
    section_key: str
    action: str
    draft_text: Optional[str] = None
    character_count: int
    plagiarism_index: float
    synthesis_count: int
    verification_sig: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SupervisorVerificationReport(BaseModel):
    student_email: str
    thesis_title: str
    topic_description: str
    section_key: str
    verification_sig: str
    timeline: List[AuthorshipLedgerOut]
    outline: List[ThesisOutlineOut]

# B2B Supervisor Cohort Schemas
class StudentProgressSummary(BaseModel):
    thesis_id: int
    student_email: str
    student_name: Optional[str] = None
    thesis_title: str
    topic_description: str
    current_section: str
    status: str
    plagiarism_index: float
    synthesis_percentage: float
    interaction_count: int
    verification_sig: str
    outline: List[ThesisOutlineOut]
    timeline: List[AuthorshipLedgerOut]

class SupervisorCohortReport(BaseModel):
    students: List[StudentProgressSummary]
    average_integrity: float
    total_interactions: int
    unlocks_cleared: int

class SupervisorInviteInput(BaseModel):
    student_email: str
    thesis_title: str
    topic_description: str


class ThesisExportReport(BaseModel):
    title: str
    student_name: str
    student_email: str
    advisor_name: Optional[str] = None
    topic_description: str
    compiled_markdown: str
    references: List[ResearchPaperOut]
    verification_sig: str
    saves_count: int
    integrity_score: float
    interaction_count: int
    is_fully_completed: bool
    resolved_comments_count: int = 0
    total_comments_count: int = 0


class SupervisorCommentCreate(BaseModel):
    section_key: str
    highlighted_quote: Optional[str] = None
    comment_text: str


class SupervisorCommentOut(BaseModel):
    id: int
    thesis_id: int
    section_key: str
    highlighted_quote: Optional[str] = None
    comment_text: str
    is_resolved: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class InstitutionOut(BaseModel):
    id: int
    name: str
    domain: str

    class Config:
        from_attributes = True


class DepartmentOut(BaseModel):
    id: int
    institution_id: int
    name: str
    dean_email: str

    class Config:
        from_attributes = True


class DepartmentAnalyticsOut(BaseModel):
    active_students_count: int
    average_originality_index: float
    average_socratic_dialogs: float
    unlocked_milestones_ratio: float
    active_advisor_licenses_count: int
    total_theses: int


class DeanHoldToggle(BaseModel):
    administrative_hold: bool




