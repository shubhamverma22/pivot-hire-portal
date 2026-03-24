from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date
from uuid import UUID
from models import UserRole, SubscriptionPlan, JobType, ApplicationStatus


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
    token: str  # Google ID token
    role: UserRole = UserRole.FOUNDER
    company_name: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


# ── User ───────────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool
    auth_provider: str = "email"
    created_at: datetime

    class Config:
        from_attributes = True


# ── Founder Profile ────────────────────────────────────────────────────────────

class FounderProfileCreate(BaseModel):
    location: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    startup_name: Optional[str] = None
    startup_role: Optional[str] = None
    startup_duration: Optional[str] = None
    startup_description: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    desired_roles: Optional[str] = None


class FounderProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    location: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    startup_name: Optional[str] = None
    startup_role: Optional[str] = None
    startup_duration: Optional[str] = None
    startup_description: Optional[str] = None
    linkedin_url: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    desired_roles: Optional[str] = None
    is_profile_complete: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ── Company Profile ────────────────────────────────────────────────────────────

class CompanyProfileCreate(BaseModel):
    company_name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None


class CompanyProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    company_name: str
    logo_url: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Subscription ───────────────────────────────────────────────────────────────

class SubscriptionOut(BaseModel):
    id: UUID
    plan: SubscriptionPlan
    is_active: bool
    applications_used_this_month: int = 0
    monthly_limit: int = 5
    current_period_end: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


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
    currency: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: Optional[bool] = None


class JobOut(BaseModel):
    id: UUID
    title: str
    role_type: JobType
    location: str
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: str = "INR"
    description: str
    requirements: Optional[str] = None
    skills_required: Optional[str] = None
    is_active: bool
    company_user_id: UUID
    company: Optional[CompanyProfileOut] = None
    application_count: int = 0
    has_applied: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Application ────────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    job_id: UUID
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None


class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: UUID
    status: ApplicationStatus
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    notes: Optional[str] = None
    candidate_id: UUID
    job_id: UUID
    candidate: Optional[UserOut] = None
    candidate_profile: Optional[FounderProfileOut] = None
    job: Optional[JobOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


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


# Forward ref resolution
Token.model_rebuild()
