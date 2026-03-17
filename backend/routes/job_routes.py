from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database import get_db
from models import Job, User, UserRole, Application, CompanyProfile
from schemas import JobCreate, JobUpdate, JobOut, CompanyProfileOut
from auth import get_current_user, get_current_user_optional, require_role

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])


async def _enrich_job(db: AsyncSession, job: Job, current_user: User = None) -> JobOut:
    """Add company info, application count, and has_applied flag."""
    # Company profile
    cp_result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == job.company_user_id)
    )
    cp = cp_result.scalar_one_or_none()

    # Application count
    count_q = await db.execute(select(func.count()).where(Application.job_id == job.id))
    count = count_q.scalar() or 0

    # Has applied?
    has_applied = False
    if current_user and current_user.role == UserRole.FOUNDER:
        app_q = await db.execute(
            select(Application).where(
                Application.job_id == job.id,
                Application.candidate_id == current_user.id,
            )
        )
        has_applied = app_q.scalar_one_or_none() is not None

    job_out = JobOut.model_validate(job)
    job_out.company = CompanyProfileOut.model_validate(cp) if cp else None
    job_out.application_count = count
    job_out.has_applied = has_applied
    return job_out


# ── Browse Jobs (public, with filters) ─────────────────────────────────────────

@router.get("", response_model=list[JobOut])
async def list_jobs(
    search: str = Query(None, description="Search title, description"),
    role_type: str = Query(None, description="Filter by job type"),
    location: str = Query(None, description="Filter by location"),
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    query = select(Job).where(Job.is_active == True).order_by(Job.created_at.desc())

    if search:
        term = f"%{search}%"
        query = query.where(
            or_(Job.title.ilike(term), Job.description.ilike(term), Job.skills_required.ilike(term))
        )
    if role_type:
        query = query.where(Job.role_type == role_type)
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    jobs = result.scalars().all()

    return [await _enrich_job(db, job, current_user) for job in jobs]


@router.get("/{job_id}", response_model=JobOut)
async def get_job(
    job_id: UUID,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return await _enrich_job(db, job, current_user)


# ── Company: CRUD Jobs ─────────────────────────────────────────────────────────

@router.post("", response_model=JobOut, status_code=201)
async def create_job(
    data: JobCreate,
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    job = Job(**data.model_dump(), company_user_id=current_user.id)
    db.add(job)
    await db.commit()
    await db.refresh(job)
    return await _enrich_job(db, job, current_user)


@router.patch("/{job_id}", response_model=JobOut)
async def update_job(
    job_id: UUID,
    data: JobUpdate,
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.company_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not your job posting")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(job, field, value)
    await db.commit()
    await db.refresh(job)
    return await _enrich_job(db, job, current_user)


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: UUID,
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.company_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not your job posting")
    await db.delete(job)
    await db.commit()


@router.get("/my/postings", response_model=list[JobOut])
async def my_jobs(
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Job).where(Job.company_user_id == current_user.id).order_by(Job.created_at.desc())
    )
    jobs = result.scalars().all()
    return [await _enrich_job(db, job, current_user) for job in jobs]
