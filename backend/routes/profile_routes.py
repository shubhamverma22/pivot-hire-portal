from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserRole, FounderProfile, CompanyProfile
from schemas import FounderProfileCreate, FounderProfileOut, CompanyProfileCreate, CompanyProfileOut
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/profile", tags=["Profiles"])


# ── Founder Profile ────────────────────────────────────────────────────────────

@router.get("/founder", response_model=FounderProfileOut)
async def get_founder_profile(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FounderProfile).where(FounderProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/founder", response_model=FounderProfileOut)
async def update_founder_profile(
    data: FounderProfileCreate,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FounderProfile).where(FounderProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = FounderProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    # Check if profile is complete (key fields filled)
    profile.is_profile_complete = all([
        profile.location, profile.bio, profile.skills,
        profile.startup_name, profile.linkedin_url or profile.resume_url,
    ])

    await db.commit()
    await db.refresh(profile)
    return profile


# ── Company Profile ────────────────────────────────────────────────────────────

@router.get("/company", response_model=CompanyProfileOut)
async def get_company_profile(
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.put("/company", response_model=CompanyProfileOut)
async def update_company_profile(
    data: CompanyProfileCreate,
    current_user: User = Depends(require_role(UserRole.COMPANY, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == current_user.id)
    )
    profile = result.scalar_one_or_none()

    if not profile:
        profile = CompanyProfile(user_id=current_user.id, company_name=data.company_name or "Company")
        db.add(profile)

    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(profile, field, value)

    await db.commit()
    await db.refresh(profile)
    return profile


# ── Public: Get company info for job listings ──────────────────────────────────

@router.get("/company/{user_id}", response_model=CompanyProfileOut)
async def get_company_public(user_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID as PyUUID
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == PyUUID(user_id))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Company not found")
    return profile
