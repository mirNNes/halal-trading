from abc import ABC, abstractmethod
from dataclasses import dataclass

@dataclass
class OrderResult:
    broker_order_id: str
    status: str
    filled_qty: float | None
    filled_price: float | None
    error: str | None = None

class BrokerClient(ABC):
    @abstractmethod
    async def get_portfolio_value(self) -> float: ...

    @abstractmethod
    async def get_position(self, ticker: str) -> float:
        """Returns current position value in USD."""
        ...

    @abstractmethod
    async def place_fractional_order(
        self, ticker: str, side: str, notional_usd: float
    ) -> OrderResult: ...

    @abstractmethod
    async def liquidate_position(self, ticker: str) -> OrderResult: ...

    @abstractmethod
    async def get_all_positions(self) -> dict[str, float]:
        """Returns {ticker: market_value_usd}"""
        ...
    @abstractmethod
    async def get_order(self, order_id: str) -> OrderResult:
        """Returns latest broker order status."""
        ...
