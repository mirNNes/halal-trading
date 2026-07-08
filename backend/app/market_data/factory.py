from app.core.config import settings
from app.market_data.alpaca import AlpacaMarketDataProvider
from app.market_data.base import MarketDataProvider
from app.market_data.yahoo import YahooFinanceProvider


def get_market_data_provider() -> MarketDataProvider:
    provider = getattr(settings, "MARKET_DATA_PROVIDER", "alpaca")

    if provider == "alpaca":
        return AlpacaMarketDataProvider()

    if provider == "yahoo":
        return YahooFinanceProvider()

    raise ValueError(f"Unsupported market data provider: {provider}")
