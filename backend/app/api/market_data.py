from fastapi import APIRouter
from app.market_data.factory import get_market_data_provider

router = APIRouter()


@router.get("/{ticker}")
async def get_market_data(ticker: str):
    provider = get_market_data_provider()
    bars = await provider.get_history(ticker.upper(), 10)

    history = [
        {
            "time": bar.date.isoformat(),
            "open": bar.open,
            "high": bar.high,
            "low": bar.low,
            "close": bar.close,
            "volume": bar.volume,
        }
        for bar in bars
    ]

    latest = history[-1] if history else None

    return {
        "ticker": ticker.upper(),
        "latest": latest,
        "history": history,
    }
