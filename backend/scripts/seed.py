import asyncio

from app.core.database import AsyncSessionLocal

from scripts.seeders.tiers import seed_subscription_tiers
from scripts.seeders.strategies import seed_strategies
from scripts.seeders.signals import seed_signals


async def main():
    async with AsyncSessionLocal() as session:
        print("=" * 50)
        print("Halal Trading Seeder")
        print("=" * 50)

        await seed_subscription_tiers(session)
        await seed_strategies(session)
        await seed_signals(session)

        print("=" * 50)
        print("Seeding completed successfully.")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
