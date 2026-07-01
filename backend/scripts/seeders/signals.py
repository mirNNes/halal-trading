from datetime import datetime, timedelta

from sqlalchemy import select

from app.models.models import Signal, Strategy


async def seed_signals(session):
    print("Seeding signals...")

    result = await session.execute(select(Strategy))
    strategies = result.scalars().all()

    strategy_map = {s.name: s.id for s in strategies}

    demo_signals = [
        ("Test Strategy", "AAPL", "BUY", "Momentum breakout", 2),
        ("Test Strategy", "MSFT", "HOLD", "Trend intact", 1),
        ("Halal Quality Strategy", "NVDA", "BUY", "Strong earnings", 3),
        ("Halal Quality Strategy", "GOOGL", "WATCH", "Approaching resistance", 5),
        ("Demo Strategy", "TSLA", "SELL", "Risk management exit", 2),
        ("Demo Strategy", "META", "BUY", "Recovered above moving average", 4),
        ("Test Strategy 2", "AMZN", "WATCH", "Waiting for confirmation", 6),
        ("Test Strategy 2", "NFLX", "BUY", "Bullish breakout", 7),
    ]

    for strategy_name, ticker, action, reason, days_ago in demo_signals:

        strategy_id = strategy_map.get(strategy_name)

        if strategy_id is None:
            continue

        existing = await session.execute(
            select(Signal).where(
                Signal.strategy_id == strategy_id,
                Signal.ticker == ticker,
                Signal.action == action,
            )
        )

        if existing.scalars().first():
            continue

        session.add(
            Signal(
                strategy_id=strategy_id,
                ticker=ticker,
                action=action,
                reason=reason,
                emitted_at=datetime.utcnow() - timedelta(days=days_ago),
            )
        )

    await session.commit()
