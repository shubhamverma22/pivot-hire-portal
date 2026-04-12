from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import date

from database import get_db
from models import (
    User, UserRole, Job, Application, FounderProfile,
    CompanyProfile, Subscription, SubscriptionPlan, ApplicationStatus
)
from schemas import (
    FounderDashboard, CompanyDashboard, FounderProfileOut,
    CompanyProfileOut, SubscriptionOut, JobOut, ApplicationOut,
    UserOut
)
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/founder", response_model=FounderDashboard)
async def founder_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dashboard = FounderDashboard()

    # Profile
    fp_result = await db.execute(
        select(FounderProfile)
        .options(selectinload(FounderProfile.startup_experiences))
        .where(FounderProfile.user_id == current_user.id)
    )
    fp = fp_result.scalar_one_or_none()
    if fp:
        dashboard.profile = FounderProfileOut.model_validate(fp)

    # Subscription
    sub_result = await db.execute(
        select(Subscription).where(Subscription.user_id == current_user.id)
    )
    sub = sub_result.scalar_one_or_none()
    if sub:
        # Reset counter if new month
        today = date.today()
        first_of_month = today.replace(day=1)
        if sub.month_reset_date != first_of_month:
            sub.month_reset_date = first_of_month
            sub.applications_used_this_month = 0
            await db.commit()
            await db.refresh(sub)

        sub_out = SubscriptionOut.model_validate(sub)
        sub_out.monthly_limit = 5 if sub.plan == SubscriptionPlan.FREE else 999999
        dashboard.subscription = sub_out
        dashboard.applications_this_month = sub.applications_used_this_month
        dashboard.monthly_limit = 5 if sub.plan == SubscriptionPlan.FREE else 999999

    # Applications
    apps_result = await db.execute(
        select(Application)
        .options(selectinload(Application.job), selectinload(Application.candidate))
        .where(Application.candidate_id == current_user.id)
        .order_by(Application.created_at.desc())
    )
    all_apps = apps_result.scalars().all()
    dashboard.total_applications = len(all_apps)

    # Status breakdown
    breakdown = {}
    for status in ApplicationStatus:
        count = sum(1 for a in all_apps if a.status == status)
        if count > 0:
            breakdown[status.value] = count
    dashboard.status_breakdown = breakdown

    # Recent applications
    dashboard.recent_applications = [
        ApplicationOut.model_validate(a) for a in all_apps[:5]
    ]

    # Total available jobs
    jobs_count = await db.execute(select(func.count()).select_from(Job).where(Job.is_active == True))
    dashboard.total_available_jobs = jobs_count.scalar() or 0

    return dashboard


@router.get("/company", response_model=CompanyDashboard)
async def company_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    dashboard = CompanyDashboard()

    # Company profile
    cp_result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    cp = cp_result.scalar_one_or_none()
    if cp:
        dashboard.profile = CompanyProfileOut.model_validate(cp)

    # Jobs
    jobs_result = await db.execute(
        select(Job).where(Job.company_user_id == current_user.id).order_by(Job.created_at.desc())
    )
    all_jobs = jobs_result.scalars().all()
    job_ids = [j.id for j in all_jobs]

    dashboard.total_jobs = len(all_jobs)
    dashboard.active_jobs = sum(1 for j in all_jobs if j.is_active)
    dashboard.recent_jobs = [JobOut.model_validate(j) for j in all_jobs[:5]]

    # Applicants across all jobs
    if job_ids:
        apps_result = await db.execute(
            select(Application)
            .options(selectinload(Application.candidate), selectinload(Application.job))
            .where(Application.job_id.in_(job_ids))
            .order_by(Application.created_at.desc())
        )
        all_apps = apps_result.scalars().all()

        dashboard.total_applicants = len(all_apps)
        dashboard.new_applicants = sum(1 for a in all_apps if a.status == ApplicationStatus.APPLIED)
        dashboard.shortlisted = sum(1 for a in all_apps if a.status == ApplicationStatus.SHORTLISTED)

        breakdown = {}
        for status in ApplicationStatus:
            count = sum(1 for a in all_apps if a.status == status)
            if count > 0:
                breakdown[status.value] = count
        dashboard.status_breakdown = breakdown

        dashboard.recent_applicants = [
            ApplicationOut.model_validate(a) for a in all_apps[:5]
        ]

    return dashboard
