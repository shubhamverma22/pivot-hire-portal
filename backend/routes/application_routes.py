from uuid import UUID
from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import (
    Application, Job, User, UserRole, Subscription,
    SubscriptionPlan, ApplicationStatus, FounderProfile
)
from schemas import ApplicationCreate, ApplicationUpdate, ApplicationOut, FounderProfileOut, UserOut
from auth import get_current_user, require_role
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/applications", tags=["Applications"])


async def _check_subscription_limit(db: AsyncSession, user: User):
    """Enforce free plan's 5 applications/month limit."""
    result = await db.execute(select(Subscription).where(Subscription.user_id == user.id))
    sub = result.scalar_one_or_none()

    if not sub:
        # Create default free subscription
        sub = Subscription(user_id=user.id, plan=SubscriptionPlan.FREE)
        db.add(sub)
        await db.flush()

    # Reset counter if new month
    today = date.today()
    first_of_month = today.replace(day=1)
    if sub.month_reset_date != first_of_month:
        sub.month_reset_date = first_of_month
        sub.applications_used_this_month = 0
        await db.flush()

    # Premium users have no limit
    if sub.plan == SubscriptionPlan.PREMIUM and sub.is_active:
        return sub

    # Free users: check limit
    if sub.applications_used_this_month >= settings.FREE_PLAN_MONTHLY_LIMIT:
        raise HTTPException(
            status_code=403,
            detail=f"Monthly application limit reached ({settings.FREE_PLAN_MONTHLY_LIMIT}). Upgrade to Premium for unlimited applications."
        )
    return sub


async def _enrich_application(db: AsyncSession, app: Application) -> ApplicationOut:
    """Add candidate user info, founder profile, and job info to an application."""
    out = ApplicationOut.model_validate(app)

    if app.candidate:
        out.candidate = UserOut.model_validate(app.candidate)
        # Must eagerly load startup_experiences — FounderProfileOut includes them
        fp_result = await db.execute(
            select(FounderProfile)
            .options(selectinload(FounderProfile.startup_experiences))
            .where(FounderProfile.user_id == app.candidate_id)
        )
        fp = fp_result.scalar_one_or_none()
        if fp:
            out.candidate_profile = FounderProfileOut.model_validate(fp)

    return out


# ── Apply to Job ───────────────────────────────────────────────────────────────

@router.post("", response_model=ApplicationOut, status_code=201)
async def apply_to_job(
    data: ApplicationCreate,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    # Check job exists and is active
    job_result = await db.execute(select(Job).where(Job.id == data.job_id, Job.is_active == True))
    if not job_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Job not found or inactive")

    # Check duplicate
    dup = await db.execute(
        select(Application).where(
            Application.candidate_id == current_user.id,
            Application.job_id == data.job_id,
        )
    )
    if dup.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You already applied to this job")

    # Check subscription limit
    sub = await _check_subscription_limit(db, current_user)

    # Create application
    app = Application(
        candidate_id=current_user.id,
        job_id=data.job_id,
        cover_letter=data.cover_letter,
        resume_url=data.resume_url,
    )
    db.add(app)

    # Increment usage counter
    sub.applications_used_this_month += 1
    await db.commit()
    await db.refresh(app)

    # Load relationships
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.candidate))
        .where(Application.id == app.id)
    )
    app = result.scalar_one()
    return await _enrich_application(db, app)


# ── Founder: My Applications ──────────────────────────────────────────────────

@router.get("/my", response_model=list[ApplicationOut])
async def my_applications(
    status: str = Query(None),
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.candidate))
        .where(Application.candidate_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    if status:
        query = query.where(Application.status == status)

    result = await db.execute(query)
    apps = result.scalars().all()
    return [await _enrich_application(db, a) for a in apps]


# ── Company: View Applicants for a Job ─────────────────────────────────────────

@router.get("/job/{job_id}", response_model=list[ApplicationOut])
async def job_applications(
    job_id: UUID,
    skill: str = Query(None, description="Filter by skill"),
    location: str = Query(None, description="Filter by location"),
    experience_min: int = Query(None, description="Minimum years experience"),
    status: str = Query(None),
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    job_result = await db.execute(select(Job).where(Job.id == job_id))
    job = job_result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.company_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not your job posting")

    query = (
        select(Application)
        .options(selectinload(Application.candidate), selectinload(Application.job))
        .where(Application.job_id == job_id)
        .order_by(Application.created_at.desc())
    )
    if status:
        query = query.where(Application.status == status)

    result = await db.execute(query)
    apps = result.scalars().all()

    enriched = []
    for app in apps:
        enriched_app = await _enrich_application(db, app)

        # Apply candidate-level filters
        if enriched_app.candidate_profile:
            cp = enriched_app.candidate_profile
            if skill and cp.skills and skill.lower() not in cp.skills.lower():
                continue
            if location and cp.location and location.lower() not in cp.location.lower():
                continue
            if experience_min and (cp.experience_years or 0) < experience_min:
                continue

        enriched.append(enriched_app)

    return enriched


# ── Company: Update Application Status ─────────────────────────────────────────

@router.patch("/{app_id}", response_model=ApplicationOut)
async def update_application(
    app_id: UUID,
    data: ApplicationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.candidate))
        .where(Application.id == app_id)
    )
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    # Authorization: company owner can update status/notes
    is_company = app.job.company_user_id == current_user.id or current_user.role == UserRole.ADMIN
    if not is_company:
        raise HTTPException(status_code=403, detail="Only the hiring company can update application status")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(app, field, value)
    await db.commit()
    await db.refresh(app)
    return await _enrich_application(db, app)
