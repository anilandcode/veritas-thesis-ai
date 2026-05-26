import datetime
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Float
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_supervisor = Column(Boolean, default=False)
    is_dean = Column(Boolean, default=False)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    theses = relationship("Thesis", back_populates="user", cascade="all, delete-orphan")
    institution = relationship("Institution", back_populates="users")
    department = relationship("Department", back_populates="users")

class Thesis(Base):
    __tablename__ = "theses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    topic_description = Column(Text, nullable=False)
    current_section = Column(String, default="Introduction")  # Introduction, Literature Review, etc.
    status = Column(String, default="Drafting")  # Drafting, Generating Shadow, Completed
    supervisor_email = Column(String, index=True, nullable=True)
    administrative_hold = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="theses")
    papers = relationship("ResearchPaper", back_populates="thesis", cascade="all, delete-orphan")
    dialogs = relationship("SocraticDialog", back_populates="thesis", cascade="all, delete-orphan")
    shadow_theses = relationship("ShadowThesis", back_populates="thesis", cascade="all, delete-orphan")
    verified_claims = relationship("VerifiedClaim", back_populates="thesis", cascade="all, delete-orphan")
    outlines = relationship("ThesisOutline", back_populates="thesis", cascade="all, delete-orphan")
    authorship_ledgers = relationship("AuthorshipLedger", back_populates="thesis", cascade="all, delete-orphan")
    supervisor_comments = relationship("SupervisorComment", back_populates="thesis", cascade="all, delete-orphan")

class ResearchPaper(Base):
    __tablename__ = "research_papers"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    authors = Column(String, nullable=True)
    journal = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    doi = Column(String, index=True, nullable=True)
    abstract = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    citation_count = Column(Integer, default=0)
    confidence_level = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="papers")

class SocraticDialog(Base):
    __tablename__ = "socratic_dialogs"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section = Column(String, nullable=False)  # Introduction, etc.
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="dialogs")

class ShadowThesis(Base):
    __tablename__ = "shadow_theses"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section = Column(String, nullable=False)  # Introduction, etc.
    generated_text = Column(Text, nullable=False)  # The perfect literature ground truth
    confidence_score = Column(Float, default=9.5)  # The confidence score out of 10
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="shadow_theses")

class VerifiedClaim(Base):
    __tablename__ = "verified_claims"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section = Column(String, default="Introduction")
    claim_text = Column(Text, nullable=False)
    supporting_dois = Column(Text, nullable=False) # Comma-separated list of DOIs
    confidence_score = Column(Float, default=1.0) # Number of supporting DOIs
    verification_status = Column(String, default="Verified") # Verified, Unverified, Logical Gap
    plagiarism_index = Column(Float, default=0.0)
    plagiarism_status = Column(String, default="Original")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="verified_claims")

class ThesisOutline(Base):
    __tablename__ = "thesis_outlines"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section_title = Column(String, nullable=False)
    section_key = Column(String, nullable=False)
    guiding_hints = Column(Text, nullable=True)
    status = Column(String, default="Locked") # Locked, Drafting, Completed
    draft_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="outlines")

class AuthorshipLedger(Base):
    __tablename__ = "authorship_ledgers"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section_key = Column(String, nullable=False)
    action = Column(String, nullable=False)  # "save_draft", "unlock_section", "plagiarism_check", "audit_failure"
    draft_text = Column(Text, nullable=True)
    character_count = Column(Integer, default=0)
    plagiarism_index = Column(Float, default=0.0)
    synthesis_count = Column(Integer, default=0)
    verification_sig = Column(String, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="authorship_ledgers")


class SupervisorComment(Base):
    __tablename__ = "supervisor_comments"
    
    id = Column(Integer, primary_key=True, index=True)
    thesis_id = Column(Integer, ForeignKey("theses.id", ondelete="CASCADE"), nullable=False)
    section_key = Column(String, nullable=False)
    highlighted_quote = Column(Text, nullable=True)
    comment_text = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    thesis = relationship("Thesis", back_populates="supervisor_comments")


class Institution(Base):
    __tablename__ = "institutions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    domain = Column(String, unique=True, nullable=False) # e.g. "stanford.edu"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    users = relationship("User", back_populates="institution")
    departments = relationship("Department", back_populates="institution", cascade="all, delete-orphan")


class Department(Base):
    __tablename__ = "departments"
    
    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    dean_email = Column(String, unique=True, nullable=False)
    
    institution = relationship("Institution", back_populates="departments")
    users = relationship("User", back_populates="department")



