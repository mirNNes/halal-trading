from datetime import date, timedelta
import yfinance as yf

from app.market_data.base import MarketDataProvider, PriceBar


class YahooFinanceProvider(MarketDataProvider):
    name = "yahoo"

    async def get_history(self, ticker: str, days: int = 250) -> list[PriceBar]:
        end = date.today()
        start = end - timedelta(days=days * 2)

        df = yf.download(
            ticker,
            start=start.isoformat(),
            end=end.isoformat(),
            progress=False,
            auto_adjust=True,
        )

        if df.empty:
            return []

        df = df.tail(days)

        bars: list[PriceBar] = []

        for index, row in df.iterrows():
            bars.append(
                PriceBar(
                    date=index.date(),
                    open=float(row["Open"]),
                    high=float(row["High"]),
                    low=float(row["Low"]),
                    close=float(row["Close"]),
                    volume=int(row["Volume"]) if row.get("Volume") is not None else None,
                )
            )

        return bars
