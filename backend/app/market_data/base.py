from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date


@dataclass
class PriceBar:
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int | None = None


class MarketDataProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def get_history(self, ticker: str, days: int = 250) -> list[PriceBar]:
        ...
