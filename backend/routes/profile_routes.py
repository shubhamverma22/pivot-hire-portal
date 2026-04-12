from uuid import UUID as PyUUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserRole, FounderProfile, CompanyProfile, StartupExperience
from schemas import (
    FounderProfileCreate, FounderProfileOut,
    CompanyProfileCreate, CompanyProfileOut,
    StartupExperienceCreate, StartupExperienceOut,
)
from auth import get_current_user, require_role

router = APIRouter(prefix="/api/profile", tags=["Profiles"])


# ── Shared helpers ─────────────────────────────────────────────────────────────

async def _get_founder_profile(db: AsyncSession, user_id) -> FounderProfile:
    """Load a founder's profile with startup experiences. Raises 404 if not found."""
    result = await db.execute(
        select(FounderProfile)
        .options(selectinload(FounderProfile.startup_experiences))
        .where(FounderProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


def _compute_is_complete(profile: FounderProfile, has_experience: bool) -> bool:
    """Return True when the profile has all required fields filled in."""
    return bool(
        profile.location
        and profile.bio
        and profile.skills
        and (profile.linkedin_url or profile.resume_url)
        and has_experience
    )


# ── Founder Profile ────────────────────────────────────────────────────────────

@router.get("/founder", response_model=FounderProfileOut)
async def get_founder_profile(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    return await _get_founder_profile(db, current_user.id)


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
        await db.flush()  # Ensure profile.id is populated before querying experiences

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    # Check completeness: at least one startup experience required
    exp_result = await db.execute(
        select(StartupExperience)
        .where(StartupExperience.founder_profile_id == profile.id)
        .limit(1)
    )
    has_experience = exp_result.scalars().first() is not None
    profile.is_profile_complete = _compute_is_complete(profile, has_experience)

    await db.commit()

    # Re-load with experiences so the response includes them
    return await _get_founder_profile(db, current_user.id)


# ── Startup Experiences ────────────────────────────────────────────────────────

@router.get("/founder/experiences", response_model=list[StartupExperienceOut])
async def list_experiences(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_founder_profile(db, current_user.id)
    result = await db.execute(
        select(StartupExperience)
        .where(StartupExperience.founder_profile_id == profile.id)
        .order_by(StartupExperience.created_at)
    )
    return result.scalars().all()


@router.post("/founder/experiences", response_model=StartupExperienceOut, status_code=201)
async def add_experience(
    data: StartupExperienceCreate,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_founder_profile(db, current_user.id)

    if data.is_primary:
        await _clear_primary_flag(db, profile.id)

    exp = StartupExperience(founder_profile_id=profile.id, **data.model_dump())
    db.add(exp)
    await db.commit()
    await db.refresh(exp)
    return exp


@router.put("/founder/experiences/{exp_id}", response_model=StartupExperienceOut)
async def update_experience(
    exp_id: PyUUID,
    data: StartupExperienceCreate,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_founder_profile(db, current_user.id)
    exp = await _get_experience_or_404(db, exp_id, profile.id)

    if data.is_primary and not exp.is_primary:
        await _clear_primary_flag(db, profile.id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(exp, field, value)

    await db.commit()
    await db.refresh(exp)
    return exp


@router.delete("/founder/experiences/{exp_id}", status_code=204)
async def delete_experience(
    exp_id: PyUUID,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_founder_profile(db, current_user.id)
    exp = await _get_experience_or_404(db, exp_id, profile.id)
    await db.delete(exp)
    await db.commit()


# ── Experience sub-helpers ─────────────────────────────────────────────────────

async def _get_experience_or_404(db: AsyncSession, exp_id, profile_id) -> StartupExperience:
    result = await db.execute(
        select(StartupExperience).where(
            StartupExperience.id == exp_id,
            StartupExperience.founder_profile_id == profile_id,
        )
    )
    exp = result.scalar_one_or_none()
    if not exp:
        raise HTTPException(status_code=404, detail="Experience not found")
    return exp


async def _clear_primary_flag(db: AsyncSession, profile_id) -> None:
    """Unmark all primary experiences for a profile so only one can be primary at a time."""
    result = await db.execute(
        select(StartupExperience).where(
            StartupExperience.founder_profile_id == profile_id,
            StartupExperience.is_primary == True,  # noqa: E712
        )
    )
    for exp in result.scalars().all():
        exp.is_primary = False


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


# ── Public: company info for job listings ──────────────────────────────────────

@router.get("/company/{user_id}", response_model=CompanyProfileOut)
async def get_company_public(user_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(CompanyProfile).where(CompanyProfile.user_id == PyUUID(user_id))
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Company not found")
    return profile
