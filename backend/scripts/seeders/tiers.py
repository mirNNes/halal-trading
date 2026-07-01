from sqlalchemy import select

from app.models.models import SubscriptionTier


async def seed_subscription_tiers(session):
    print("Seeding subscription tiers...")

    tiers = [
        {
            "name": "free",
            "price_monthly_cents": 0,
            "backtest_quota": 3,
            "live_signals_enabled": False,
        },
        {
            "name": "pro",
            "price_monthly_cents": 2900,
            "backtest_quota": 100,
            "live_signals_enabled": True,
        },
        {
            "name": "premium",
            "price_monthly_cents": 9900,
            "backtest_quota": 1000,
            "live_signals_enabled": True,
        },
    ]

    for tier_data in tiers:
        result = await session.execute(
            select(SubscriptionTier).where(
                SubscriptionTier.name == tier_data["name"]
            )
        )

        existing_tier = result.scalar_one_or_none()

        if existing_tier:
            continue

        session.add(SubscriptionTier(**tier_data))

    await session.commit()
