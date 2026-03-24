import hashlib
import hmac
import json
import traceback
from datetime import date

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, UserRole, Subscription, SubscriptionPlan
from schemas import SubscriptionOut, CreateCheckoutRequest, RazorpayVerifyRequest
from auth import get_current_user, require_role
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/subscription", tags=["Subscription"])

RAZORPAY_BASE_URL = "https://api.razorpay.com/v1"


async def razorpay_request(method: str, path: str, payload: dict = None) -> dict:
    """Make an authenticated request to the Razorpay API."""
    async with httpx.AsyncClient() as client:
        resp = await client.request(
            method,
            f"{RAZORPAY_BASE_URL}{path}",
            json=payload,
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET),
            timeout=30.0,
        )
        data = resp.json()
        if resp.status_code >= 400:
            error_desc = data.get("error", {}).get("description", resp.text)
            raise Exception(f"Razorpay API error ({resp.status_code}): {error_desc}")
        return data


# ── Public pricing endpoint (frontend fetches this) ───────────────────────────

@router.get("/plans")
async def get_plans():
    """Return pricing config so the frontend never hardcodes prices."""
    return {
        "free": {
            "name": "Free",
            "amount": 0,
            "currency": settings.PREMIUM_PLAN_CURRENCY,
            "currency_symbol": "₹" if settings.PREMIUM_PLAN_CURRENCY == "INR" else "$",
            "monthly_limit": settings.FREE_PLAN_MONTHLY_LIMIT,
            "features": [
                f"{settings.FREE_PLAN_MONTHLY_LIMIT} job applications per month",
                "Browse all available jobs",
                "Create your founder profile",
                "Track application status",
                "Basic access",
            ],
        },
        "premium": {
            "name": settings.PREMIUM_PLAN_NAME,
            "amount": settings.PREMIUM_PLAN_AMOUNT,
            "currency": settings.PREMIUM_PLAN_CURRENCY,
            "currency_symbol": "₹" if settings.PREMIUM_PLAN_CURRENCY == "INR" else "$",
            "description": settings.PREMIUM_PLAN_DESCRIPTION,
            "monthly_limit": 999999,
            "features": [
                "Unlimited job applications",
                "Everything in Free",
                "Boosted profile visibility",
                "Priority in candidate listings",
                "Stand out to top companies",
            ],
        },
    }


# ── Current subscription ──────────────────────────────────────────────────────

@router.get("", response_model=SubscriptionOut)
async def get_subscription(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=current_user.id, plan=SubscriptionPlan.FREE)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)

    # Reset counter if new month
    today = date.today()
    first_of_month = today.replace(day=1)
    if sub.month_reset_date != first_of_month:
        sub.month_reset_date = first_of_month
        sub.applications_used_this_month = 0
        await db.commit()
        await db.refresh(sub)

    out = SubscriptionOut.model_validate(sub)
    out.monthly_limit = settings.FREE_PLAN_MONTHLY_LIMIT if sub.plan == SubscriptionPlan.FREE else 999999
    return out


# ── Checkout (create Razorpay subscription) ───────────────────────────────────

@router.post("/checkout")
async def create_checkout_session(
    data: CreateCheckoutRequest,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    """Create a Razorpay subscription for Premium upgrade."""
    if not settings.RAZORPAY_KEY_ID:
        # Demo mode — directly upgrade
        result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
        sub = result.scalar_one_or_none()
        if sub:
            sub.plan = SubscriptionPlan.PREMIUM
            sub.is_active = True
            await db.commit()
        return {
            "demo": True,
            "message": "Demo mode: upgraded to Premium",
            "url": data.success_url or f"{settings.FRONTEND_URL}/dashboard",
        }

    # Get or create subscription record
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=current_user.id, plan=SubscriptionPlan.FREE)
        db.add(sub)
        await db.flush()

    # Create Razorpay subscription via HTTP API
    try:
        razorpay_sub = await razorpay_request("POST", "/subscriptions", {
            "plan_id": settings.RAZORPAY_PLAN_ID_PREMIUM,
            "total_count": 12,
            "quantity": 1,
            "notes": {
                "user_id": str(current_user.id),
                "email": current_user.email,
            },
        })
        print(f"[CHECKOUT] Razorpay subscription created: {razorpay_sub.get('id')}")
    except Exception as e:
        print(f"[CHECKOUT] Razorpay API error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=502, detail=f"Razorpay error: {str(e)}")

    sub.razorpay_subscription_id = razorpay_sub["id"]
    await db.commit()

    return {
        "demo": False,
        "subscription_id": razorpay_sub["id"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": settings.PREMIUM_PLAN_AMOUNT_PAISE,
        "currency": settings.PREMIUM_PLAN_CURRENCY,
        "name": settings.PREMIUM_PLAN_NAME,
        "description": settings.PREMIUM_PLAN_DESCRIPTION,
        "user_email": current_user.email,
        "user_name": current_user.full_name,
    }


# ── Verify payment ────────────────────────────────────────────────────────────

@router.post("/verify")
async def verify_payment(
    data: RazorpayVerifyRequest,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    """Verify Razorpay payment signature and activate Premium."""
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=400, detail="Razorpay not configured")

    # Verify signature
    message = f"{data.razorpay_payment_id}|{data.razorpay_subscription_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if expected_signature != data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    # Activate Premium
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    if sub:
        sub.plan = SubscriptionPlan.PREMIUM
        sub.is_active = True
        sub.razorpay_subscription_id = data.razorpay_subscription_id
        sub.razorpay_payment_id = data.razorpay_payment_id
        await db.commit()

    return {"message": "Payment verified. Premium activated!"}


# ── Webhook ───────────────────────────────────────────────────────────────────

@router.post("/webhook")
async def razorpay_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Razorpay webhook events."""
    if not settings.RAZORPAY_KEY_ID:
        return {"status": "skipped (demo mode)"}

    payload = await request.body()
    sig_header = request.headers.get("x-razorpay-signature", "")

    # Verify webhook signature
    if settings.RAZORPAY_WEBHOOK_SECRET:
        expected = hmac.new(
            settings.RAZORPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha256,
        ).hexdigest()
        if expected != sig_header:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event = json.loads(payload)
    event_type = event.get("event")

    if event_type == "subscription.activated":
        sub_data = event.get("payload", {}).get("subscription", {}).get("entity", {})
        razorpay_sub_id = sub_data.get("id")
        if razorpay_sub_id:
            result = await db.execute(
                select(Subscription).where(Subscription.razorpay_subscription_id == razorpay_sub_id)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.plan = SubscriptionPlan.PREMIUM
                sub.is_active = True
                await db.commit()

    elif event_type in ("subscription.cancelled", "subscription.completed"):
        sub_data = event.get("payload", {}).get("subscription", {}).get("entity", {})
        razorpay_sub_id = sub_data.get("id")
        if razorpay_sub_id:
            result = await db.execute(
                select(Subscription).where(Subscription.razorpay_subscription_id == razorpay_sub_id)
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.plan = SubscriptionPlan.FREE
                sub.is_active = True
                sub.razorpay_subscription_id = None
                await db.commit()

    return {"status": "ok"}


# ── Cancel ────────────────────────────────────────────────────────────────────

@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    if not sub or sub.plan != SubscriptionPlan.PREMIUM:
        raise HTTPException(status_code=400, detail="No active premium subscription")

    if settings.RAZORPAY_KEY_ID and sub.razorpay_subscription_id:
        try:
            await razorpay_request("POST", f"/subscriptions/{sub.razorpay_subscription_id}/cancel")
        except Exception:
            pass  # If already cancelled on Razorpay side, proceed anyway

    sub.plan = SubscriptionPlan.FREE
    sub.razorpay_subscription_id = None
    sub.razorpay_payment_id = None
    await db.commit()
    return {"message": "Subscription cancelled, reverted to Free plan"}
