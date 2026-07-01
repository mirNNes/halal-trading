from sqlalchemy import select

from app.models.models import Strategy


async def seed_strategies(session):
    print("Seeding strategies...")

    strategies = [
        {
            "name": "Test Strategy",
            "description": "Manual local strategy",
            "risk_profile": "medium",
        },
        {
            "name": "Halal Quality Strategy",
            "description": "Local demo strategy for halal-compliant backtesting",
            "risk_profile": "medium",
        },
        {
            "name": "Demo Strategy",
            "description": "Created by seed",
            "risk_profile": "low",
        },
        {
            "name": "Test Strategy 2",
            "description": "Created by seed",
            "risk_profile": "high",
        },
    ]

    for strategy_data in strategies:
        result = await session.execute(
            select(Strategy).where(
                Strategy.name == strategy_data["name"]
            )
        )

        existing_strategy = result.scalar_one_or_none()

        if existing_strategy:
            continue

        session.add(
            Strategy(
                **strategy_data,
                is_active=True,
                is_live=False,
            )
        )

    await session.commit()
