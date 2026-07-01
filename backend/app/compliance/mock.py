from app.compliance.base import ComplianceProvider, ComplianceStatus

# Hardcoded halal list for development — replace with Zoya when ready
_HALAL = {
    "AAPL", "MSFT", "GOOG", "GOOGL", "AMZN", "META", "NVDA",
    "TSLA", "ADBE", "CRM", "ORCL", "INTC", "AMD", "QCOM",
}

class MockProvider(ComplianceProvider):
    name = "mock"

    async def get_batch_status(self, tickers: list[str]) -> list[ComplianceStatus]:
        return [
            ComplianceStatus(
                ticker=t,
                status="halal" if t in _HALAL else "haram",
                confidence=1.0,
                raw={"source": "mock"},
            )
            for t in tickers
        ]
