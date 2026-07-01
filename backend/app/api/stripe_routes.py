import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.core.database import get_db
from app.core.auth import current_user
from app.models.models import User, Subscription, SubscriptionTier
from app.services.stripe_service import (
    get_or_create_customer,
    create_checkout_session,
    create_portal_session,
    handle_webhook_event,
)

router = APIRouter()

stripe.api_key = settings.STRIPE_SECRET_KEY


class CheckoutRequest(BaseModel):
    tier: str  # "starter" | "pro"


@router.post("/checkout")
async def start_checkout(
    req: CheckoutRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.tier not in ("starter", "pro"):
        raise HTTPException(400, "Invalid tier")

    tier_result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.name == req.tier)
    )
    tier = tier_result.scalar_one_or_none()
    if not tier:
        raise HTTPException(404, "Tier not found")

    customer_id = await get_or_create_customer(user, db)
    session = await create_checkout_session(customer_id, tier, user.id)

    return {"checkout_url": session.url}


@router.post("/portal")
async def billing_portal(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    customer_id = await get_or_create_customer(user, db)
    session = await create_portal_session(customer_id)
    return {"portal_url": session.url}


@router.get("/subscription")
async def get_subscription(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Subscription, SubscriptionTier)
        .join(SubscriptionTier)
        .where(Subscription.user_id == user.id)
    )
    row = result.first()
    if not row:
        # Return free tier info
        free = await db.execute(
            select(SubscriptionTier).where(SubscriptionTier.name == "free")
        )
        tier = free.scalar_one_or_none()
        return {
            "tier": "free",
            "status": "active",
            "liveSignalsEnabled": False,
            "backtestQuota": tier.backtest_quota if tier else 3,
            "validUntil": None,
        }

    sub, tier = row
    return {
        "tier": tier.name,
        "status": sub.status,
        "liveSignalsEnabled": tier.live_signals_enabled,
        "backtestQuota": tier.backtest_quota,
        "validUntil": sub.valid_until.isoformat() if sub.valid_until else None,
    }


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid Stripe signature")

    await handle_webhook_event(event, db)
    return {"status": "ok"}
