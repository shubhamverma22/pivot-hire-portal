from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserRole, FounderProfile, CompanyProfile, Subscription, SubscriptionPlan
from schemas import (
    FounderRegister, CompanyRegister, LoginRequest,
    GoogleAuthRequest, Token, UserOut
)
from auth import (
    hash_password, verify_password, create_access_token,
    get_current_user, verify_google_token
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


async def _create_user_defaults(db: AsyncSession, user: User, company_name: str = None):
    """Create profile + subscription for new user."""
    if user.role == UserRole.FOUNDER:
        db.add(FounderProfile(user_id=user.id))
        db.add(Subscription(user_id=user.id, plan=SubscriptionPlan.FREE))
    elif user.role == UserRole.COMPANY:
        db.add(CompanyProfile(
            user_id=user.id,
            company_name=company_name or user.full_name,
        ))


def _make_token_response(user: User) -> Token:
    access_token = create_access_token(user.id, user.role.value)
    return Token(access_token=access_token, user=UserOut.model_validate(user))


# ── Email Registration ─────────────────────────────────────────────────────────

@router.post("/register/founder", response_model=Token, status_code=201)
async def register_founder(data: FounderRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.FOUNDER,
        auth_provider="email",
    )
    db.add(user)
    await db.flush()
    await _create_user_defaults(db, user)
    await db.commit()
    await db.refresh(user)
    return _make_token_response(user)


@router.post("/register/company", response_model=Token, status_code=201)
async def register_company(data: CompanyRegister, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=data.email,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        role=UserRole.COMPANY,
        auth_provider="email",
    )
    db.add(user)
    await db.flush()
    await _create_user_defaults(db, user, company_name=data.company_name)
    await db.commit()
    await db.refresh(user)
    return _make_token_response(user)


# ── Login ──────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.hashed_password or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    return _make_token_response(user)


# ── Google OAuth ───────────────────────────────────────────────────────────────

@router.post("/google", response_model=Token)
async def google_auth(data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    google_data = await verify_google_token(data.token)
    google_id = google_data["sub"]
    email = google_data["email"]
    name = google_data.get("name", email.split("@")[0])
    avatar = google_data.get("picture")

    # Check if user exists by google_id or email
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # Existing user — update google_id if needed
        if not user.google_id:
            user.google_id = google_id
            user.auth_provider = "google"
            await db.commit()
    else:
        # New user
        user = User(
            email=email,
            full_name=name,
            role=data.role,
            auth_provider="google",
            google_id=google_id,
            avatar_url=avatar,
        )
        db.add(user)
        await db.flush()
        await _create_user_defaults(db, user, company_name=data.company_name)
        await db.commit()

    await db.refresh(user)
    return _make_token_response(user)


# ── Me ─────────────────────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
