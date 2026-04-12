from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from models import UserRole, SubscriptionPlan, JobType, ApplicationStatus, StartupStatus


# ── Auth ───────────────────────────────────────────────────────────────────────

class FounderRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class CompanyRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    token: str
    role: UserRole = UserRole.FOUNDER
    company_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── User ───────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool
    auth_provider: str = "email"
    created_at: datetime


# ── Startup Experience ─────────────────────────────────────────────────────────

class StartupExperienceCreate(BaseModel):
    startup_name: Optional[str] = None
    startup_link: Optional[str] = None
    startup_role: Optional[str] = None
    field_expertise: Optional[str] = None
    industry: Optional[str] = None
    industry_category: Optional[str] = None
    startup_status: Optional[StartupStatus] = None
    startup_description: Optional[str] = None
    stage_description: Optional[str] = None
    startup_duration: Optional[str] = None
    is_primary: bool = False


class StartupExperienceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    founder_profile_id: UUID
    startup_name: Optional[str] = None
    startup_link: Optional[str] = None
    startup_role: Optional[str] = None
    field_expertise: Optional[str] = None
    industry: Optional[str] = None
    industry_category: Optional[str] = None
    startup_status: Optional[StartupStatus] = None
    startup_description: Optional[str] = None
    stage_description: Optional[str] = None
    startup_duration: Optional[str] = None
    is_primary: bool = False
    created_at: datetime


# ── Founder Profile ────────────────────────────────────────────────────────────

class FounderProfileCreate(BaseModel):
    location: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    desired_roles: Optional[str] = None


class FounderProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    location: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    desired_roles: Optional[str] = None
    is_profile_complete: bool = False
    startup_experiences: list[StartupExperienceOut] = []
    created_at: datetime


# ── Company Profile ────────────────────────────────────────────────────────────

class CompanyProfileCreate(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    category: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


class CompanyProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    company_name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    category: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime


# ── Subscription ───────────────────────────────────────────────────────────────

class SubscriptionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    plan: SubscriptionPlan
    is_active: bool
    applications_used_this_month: int = 0
    monthly_limit: int = 5
    current_period_end: Optional[datetime] = None
    created_at: datetime


class CreateCheckoutRequest(BaseModel):
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


class RazorpayVerifyRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


# ── Forgot / Reset Password ──────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=6, max_length=128)


# ── Job ────────────────────────────────────────────────────────────────────────

class JobCreate(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    role_type: JobType = JobType.FULL_TIME
    location: str = Field(min_length=1, max_length=255)
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_disclosed: bool = True
    currency: str = "INR"
    description: str = Field(min_length=10)
    requirements: Optional[str] = None
    skills_required: Optional[str] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    role_type: Optional[JobType] = None
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_disclosed: Optional[bool] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    role_type: JobType
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    salary_disclosed: bool = True
    currency: str = "INR"
    description: str
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: bool
    company_user_id: UUID
    # These are set manually by route helpers, not from ORM directly
    company: Optional[CompanyProfileOut] = None
    application_count: int = 0
    has_applied: bool = False
    created_at: datetime
    updated_at: datetime


# ── Application ────────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: UUID
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: ApplicationStatus
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None
    candidate_id: UUID
    job_id: UUID
    # These are set manually by _enrich_application, not from ORM directly
    candidate: Optional[UserOut] = None
    candidate_profile: Optional[FounderProfileOut] = None
    job: Optional[JobOut] = None
    created_at: datetime
    updated_at: datetime


# ── Dashboard ──────────────────────────────────────────────────────────────────

class FounderDashboard(BaseModel):
    profile: Optional[FounderProfileOut] = None
    subscription: Optional[SubscriptionOut] = None
    total_applications: int = 0
    applications_this_month: int = 0
    monthly_limit: int = 5
    status_breakdown: dict = {}
    recent_applications: list[ApplicationOut] = []
    total_available_jobs: int = 0


class CompanyDashboard(BaseModel):
    profile: Optional[CompanyProfileOut] = None
    total_jobs: int = 0
    active_jobs: int = 0
    total_applicants: int = 0
    new_applicants: int = 0
    shortlisted: int = 0
    status_breakdown: dict = {}
    recent_jobs: list[JobOut] = []
    recent_applicants: list[ApplicationOut] = []


# Required for forward reference in Token.user → UserOut
Token.model_rebuild()
