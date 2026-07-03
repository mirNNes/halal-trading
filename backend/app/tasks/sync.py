import asyncio
import json
from datetime import date
from celery_worker import celery
from app.compliance import get_provider
from app.core.database import AsyncSessionLocal
from app.models.models import ComplianceSnapshot, HalalUniverse
from sqlalchemy import text

# S&P 500 tickers — keep this in a static file or fetch from a market data API
SP500_TICKERS = [
    "AAPL", "MSFT", "AMZN", "NVDA", "GOOGL", "GOOG", "META", "BRK.B",
    "LLY", "AVGO", "JPM", "TSLA", "UNH", "V", "XOM", "MA", "JNJ",
    "PG", "MRK", "HD", "ORCL", "ABBV", "CVX", "ADBE", "CRM", "AMD",
    # ... add full S&P 500 list
]

@celery.task(name="app.tasks.sync.sync_compliance_universe")
def sync_compliance_universe():
    asyncio.run(_sync())

async def _sync():
    provider = get_provider()
    today = date.today()
    statuses = await provider.get_batch_status(SP500_TICKERS)

    async with AsyncSessionLocal() as db:
        for s in statuses:
            await db.execute(text("""
                INSERT INTO compliance_snapshots (date, ticker, provider, status, raw_response)
                VALUES (:date, :ticker, :provider, :status, :raw)
                ON CONFLICT (date, ticker, provider)
                DO UPDATE SET status = EXCLUDED.status, raw_response = EXCLUDED.raw_response
            """), {
                "date": today,
                "ticker": s.ticker,
                "provider": provider.name,
                "status": s.status,
                "raw": json.dumps(s.raw),
            })

        # Rebuild today's halal universe
        await db.execute(
            text("DELETE FROM halal_universe WHERE date = :date"),
            {"date": today}
        )
        await db.execute(text("""
            INSERT INTO halal_universe (date, ticker)
            SELECT date, ticker FROM compliance_snapshots
            WHERE date = :date AND status = 'halal'
        """), {"date": today})

        await db.commit()
