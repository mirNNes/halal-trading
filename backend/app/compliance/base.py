from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ComplianceStatus:
    ticker: str
    status: str  # halal | haram | doubtful
    confidence: float = 1.0
    reason: str | None = None
    source: str = "unknown"
    score: float | None = None
    raw: dict = field(default_factory=dict)


class ComplianceProvider(ABC):
    name: str = "base"

    @abstractmethod
    async def get_batch_status(self, tickers: list[str]) -> list[ComplianceStatus]:
        ...
