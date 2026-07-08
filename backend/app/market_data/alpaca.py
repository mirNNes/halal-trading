from datetime import date, timedelta

import httpx

from app.core.config import settings
from app.market_data.base import MarketDataProvider, PriceBar


class AlpacaMarketDataProvider(MarketDataProvider):
    name = "alpaca"

    def __init__(self):
        self._base = settings.ALPACA_DATA_BASE_URL
        self._headers = {
            "APCA-API-KEY-ID": settings.ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": settings.ALPACA_API_SECRET,
        }

    async def get_history(self, ticker: str, days: int = 250) -> list[PriceBar]:
        end = date.today()
        start = end - timedelta(days=days * 2)

        params = {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "timeframe": "1Day",
            "adjustment": "all",
            "feed": "iex",
            "limit": days,
        }

        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self._base}/v2/stocks/{ticker}/bars",
                headers=self._headers,
                params=params,
                timeout=20,
            )

            r.raise_for_status()
            data = r.json()

        bars = []

        for item in data.get("bars", []):
            bars.append(
                PriceBar(
                    date=date.fromisoformat(item["t"][:10]),
                    open=float(item["o"]),
                    high=float(item["h"]),
                    low=float(item["l"]),
                    close=float(item["c"]),
                    volume=int(item["v"]) if item.get("v") is not None else None,
                )
            )

        return bars
