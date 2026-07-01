import stripe
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.models.models import User, Subscription, SubscriptionTier

stripe.api_key = settings.STRIPE_SECRET_KEY

# Map tier names to Stripe Price IDs — fill in from your Stripe dashboard
TIER_PRICE_IDS: dict[str, str] = {
    "starter": settings.STRIPE_PRICE_STARTER,
    "pro": settings.STRIPE_PRICE_PRO,
}


async def get_or_create_customer(user: User, db: AsyncSession) -> str:
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(
        email=user.email,
        metadata={"user_id": str(user.id)},
    )
    user.stripe_customer_id = customer.id
    await db.commit()
    return customer.id


async def create_checkout_session(
    customer_id: str,
    tier: SubscriptionTier,
    user_id: int,
) -> stripe.checkout.Session:
    price_id = TIER_PRICE_IDS.get(tier.name)
    if not price_id:
        raise ValueError(f"No Stripe price configured for tier: {tier.name}")

    return stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=f"{settings.FRONTEND_URL}/billing?upgraded=true",
        cancel_url=f"{settings.FRONTEND_URL}/pricing",
        metadata={"user_id": str(user_id), "tier": tier.name},
        subscription_data={
            "metadata": {"user_id": str(user_id), "tier": tier.name}
        },
    )


async def create_portal_session(customer_id: str) -> stripe.billing_portal.Session:
    return stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.FRONTEND_URL}/billing",
    )


async def handle_webhook_event(event: dict, db: AsyncSession) -> None:
    etype = event["type"]

    if etype == "checkout.session.completed":
        session = event["data"]["object"]
        if session.get("mode") != "subscription":
            return
        await _upsert_subscription(
            db,
            user_id=int(session["metadata"]["user_id"]),
            tier_name=session["metadata"]["tier"],
            stripe_subscription_id=session["subscription"],
            status="active",
            valid_until=None,
        )

    elif etype == "customer.subscription.updated":
        sub = event["data"]["object"]
        tier_name = sub.get("metadata", {}).get("tier")
        if not tier_name:
            return
        valid_until = (
            datetime.fromtimestamp(sub["current_period_end"])
            if sub.get("current_period_end")
            else None
        )
        await _upsert_subscription(
            db,
            user_id=int(sub["metadata"]["user_id"]),
            tier_name=tier_name,
            stripe_subscription_id=sub["id"],
            status=_map_status(sub["status"]),
            valid_until=valid_until,
        )

    elif etype == "customer.subscription.deleted":
        sub = event["data"]["object"]
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == sub["id"]
            )
        )
        subscription = result.scalar_one_or_none()
        if subscription:
            subscription.status = "cancelled"
            await db.commit()

    elif etype == "invoice.payment_failed":
        invoice = event["data"]["object"]
        stripe_sub_id = invoice.get("subscription")
        if not stripe_sub_id:
            return
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_subscription_id == stripe_sub_id
            )
        )
        subscription = result.scalar_one_or_none()
        if subscription:
            subscription.status = "past_due"
            await db.commit()


async def _upsert_subscription(
    db: AsyncSession,
    user_id: int,
    tier_name: str,
    stripe_subscription_id: str,
    status: str,
    valid_until: datetime | None,
) -> None:
    tier_result = await db.execute(
        select(SubscriptionTier).where(SubscriptionTier.name == tier_name)
    )
    tier = tier_result.scalar_one_or_none()
    if not tier:
        return

    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result.scalar_one_or_none()

    if subscription:
        subscription.tier_id = tier.id
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.status = status
        subscription.valid_until = valid_until
    else:
        subscription = Subscription(
            user_id=user_id,
            tier_id=tier.id,
            stripe_subscription_id=stripe_subscription_id,
            status=status,
            valid_until=valid_until,
        )
        db.add(subscription)

    await db.commit()


def _map_status(stripe_status: str) -> str:
    return {
        "active": "active",
        "past_due": "past_due",
        "canceled": "cancelled",
        "unpaid": "past_due",
        "trialing": "active",
    }.get(stripe_status, stripe_status)
