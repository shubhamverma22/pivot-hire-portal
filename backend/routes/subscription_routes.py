from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from database import get_db
from models import User, UserRole, Subscription, SubscriptionPlan
from schemas import SubscriptionOut, CreateCheckoutRequest
from auth import get_current_user, require_role
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/subscription", tags=["Subscription"])


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
    out.monthly_limit = 5 if sub.plan == SubscriptionPlan.FREE else 999999
    return out


@router.post("/checkout")
async def create_checkout_session(
    data: CreateCheckoutRequest,
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    """Create a Stripe Checkout session for Premium subscription."""
    if not settings.STRIPE_SECRET_KEY:
        # Demo mode — directly upgrade
        result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
        sub = result.scalar_one_or_none()
        if sub:
            sub.plan = SubscriptionPlan.PREMIUM
            sub.is_active = True
            await db.commit()
        return {
            "message": "Demo mode: upgraded to Premium",
            "url": data.success_url or f"{settings.FRONTEND_URL}/dashboard",
        }

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    # Get or create Stripe customer
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()

    if not sub:
        sub = Subscription(user_id=current_user.id, plan=SubscriptionPlan.FREE)
        db.add(sub)
        await db.flush()

    if not sub.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"user_id": str(current_user.id)},
        )
        sub.stripe_customer_id = customer.id
        await db.commit()

    session = stripe.checkout.Session.create(
        customer=sub.stripe_customer_id,
        mode="subscription",
        line_items=[{"price": settings.STRIPE_PRICE_ID_PREMIUM, "quantity": 1}],
        success_url=data.success_url or f"{settings.FRONTEND_URL}/dashboard?upgraded=true",
        cancel_url=data.cancel_url or f"{settings.FRONTEND_URL}/pricing",
        metadata={"user_id": str(current_user.id)},
    )

    return {"url": session.url, "session_id": session.id}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """Handle Stripe webhook events."""
    if not settings.STRIPE_SECRET_KEY:
        return {"status": "skipped (demo mode)"}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("metadata", {}).get("user_id")
        if user_id:
            from uuid import UUID
            result = await db.execute(
                select(Subscription).where(Subscription.user_id == UUID(user_id))
            )
            sub = result.scalar_one_or_none()
            if sub:
                sub.plan = SubscriptionPlan.PREMIUM
                sub.is_active = True
                sub.stripe_subscription_id = session.get("subscription")
                await db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == subscription["id"]
            )
        )
        sub = result.scalar_one_or_none()
        if sub:
            sub.plan = SubscriptionPlan.FREE
            sub.is_active = True
            sub.stripe_subscription_id = None
            await db.commit()

    return {"status": "ok"}


@router.post("/cancel")
async def cancel_subscription(
    current_user: User = Depends(require_role(UserRole.FOUNDER)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Subscription).where(Subscription.user_id == current_user.id))
    sub = result.scalar_one_or_none()
    if not sub or sub.plan != SubscriptionPlan.PREMIUM:
        raise HTTPException(status_code=400, detail="No active premium subscription")

    if settings.STRIPE_SECRET_KEY and sub.stripe_subscription_id:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        stripe.Subscription.cancel(sub.stripe_subscription_id)

    sub.plan = SubscriptionPlan.FREE
    sub.stripe_subscription_id = None
    await db.commit()
    return {"message": "Subscription cancelled, reverted to Free plan"}
