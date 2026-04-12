import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, DateTime, ForeignKey,
    Enum as SAEnum, Integer, Boolean, Date
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base


def utcnow():
    return datetime.now(timezone.utc)


# ── Enums ──────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    FOUNDER = "founder"
    COMPANY = "company"
    ADMIN = "admin"


class SubscriptionPlan(str, enum.Enum):
    FREE = "free"
    PREMIUM = "premium"


class JobType(str, enum.Enum):
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    REMOTE = "remote"


class ApplicationStatus(str, enum.Enum):
    DRAFT = "draft"
    APPLIED = "applied"
    VIEWED = "viewed"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class StartupStatus(str, enum.Enum):
    ACTIVE = "active"
    ACQUIRED = "acquired"
    DISCONTINUED = "discontinued"
    CLOSED = "closed"
    BANKRUPTCY = "bankruptcy"


# ── User ───────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)
    full_name = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    auth_provider = Column(String(20), default="email")
    google_id = Column(String(255), nullable=True, unique=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    founder_profile = relationship("FounderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    company_profile = relationship("CompanyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="candidate", cascade="all, delete-orphan")
    jobs = relationship("Job", back_populates="company_user", cascade="all, delete-orphan")


# ── Founder Profile ────────────────────────────────────────────────────────────

class FounderProfile(Base):
    __tablename__ = "founder_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    location = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    headline = Column(String(255), nullable=True)       # personal headline
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)     # profile photo URL
    # Legacy single startup fields (kept for backward compat, use StartupExperience going forward)
    startup_name = Column(String(255), nullable=True)
    startup_role = Column(String(255), nullable=True)
    startup_duration = Column(String(100), nullable=True)
    startup_description = Column(Text, nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    github_url = Column(String(500), nullable=True)
    resume_url = Column(String(500), nullable=True)
    portfolio_url = Column(String(500), nullable=True)
    skills = Column(Text, nullable=True)               # comma-separated
    experience_years = Column(Integer, nullable=True)
    desired_roles = Column(Text, nullable=True)        # comma-separated
    is_profile_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="founder_profile")
    startup_experiences = relationship(
        "StartupExperience",
        back_populates="founder_profile",
        cascade="all, delete-orphan",
        order_by="StartupExperience.created_at",
    )


# ── Startup Experience ─────────────────────────────────────────────────────────

class StartupExperience(Base):
    __tablename__ = "startup_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    founder_profile_id = Column(UUID(as_uuid=True), ForeignKey("founder_profiles.id"), nullable=False)
    startup_name = Column(String(255), nullable=True)
    startup_link = Column(String(500), nullable=True)      # URL to startup
    startup_role = Column(String(255), nullable=True)      # CEO & Co-founder, CTO, etc.
    field_expertise = Column(String(255), nullable=True)   # product, growth, engineering, etc.
    industry = Column(String(255), nullable=True)          # fintech, edtech, etc.
    industry_category = Column(String(255), nullable=True) # B2B SaaS, B2C, marketplace, etc.
    startup_status = Column(SAEnum(StartupStatus), nullable=True)
    startup_description = Column(Text, nullable=True)      # what did the startup do
    stage_description = Column(Text, nullable=True)        # what went wrong / lessons learned
    startup_duration = Column(String(100), nullable=True)  # e.g. "2020-2023"
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    founder_profile = relationship("FounderProfile", back_populates="startup_experiences")


# ── Company Profile ────────────────────────────────────────────────────────────

class CompanyProfile(Base):
    __tablename__ = "company_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    logo_url = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    industry = Column(String(255), nullable=True)
    category = Column(String(255), nullable=True)      # B2B SaaS, B2C, marketplace, etc.
    company_size = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="company_profile")


# ── Subscription ───────────────────────────────────────────────────────────────

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    plan = Column(SAEnum(SubscriptionPlan), default=SubscriptionPlan.FREE, nullable=False)
    razorpay_customer_id = Column(String(255), nullable=True)
    razorpay_subscription_id = Column(String(255), nullable=True)
    razorpay_payment_id = Column(String(255), nullable=True)
    current_period_start = Column(DateTime(timezone=True), nullable=True)
    current_period_end = Column(DateTime(timezone=True), nullable=True)
    applications_used_this_month = Column(Integer, default=0)
    month_reset_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="subscription")


# ── Job ────────────────────────────────────────────────────────────────────────

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    role_type = Column(SAEnum(JobType), default=JobType.FULL_TIME, nullable=False)
    location = Column(String(255), nullable=False)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    salary_disclosed = Column(Boolean, default=True)   # whether to show salary publicly
    currency = Column(String(10), default="INR")
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    skills_required = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    company_user = relationship("User", back_populates="jobs")
    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")


# ── Application ────────────────────────────────────────────────────────────────

class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.APPLIED, nullable=False)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    candidate = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")


# ── Password Reset Token ──────────────────────────────────────────────────────

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utcnow)

    user = relationship("User")
