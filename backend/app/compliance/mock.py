from app.compliance.base import ComplianceProvider, ComplianceStatus

_HALAL = {
    "AAPL", "MSFT", "GOOG", "GOOGL", "AMZN", "META", "NVDA",
    "TSLA", "ADBE", "CRM", "ORCL", "INTC", "AMD", "QCOM",
}

_DOUBTFUL = {
    "NFLX", "DIS",
}

_REASONS = {
    "halal": "Passed mock halal screening rules.",
    "haram": "Failed mock halal screening rules.",
    "doubtful": "Requires manual review before inclusion.",
}


class MockProvider(ComplianceProvider):
    name = "mock"

    async def get_batch_status(self, tickers: list[str]) -> list[ComplianceStatus]:
        results = []

        for ticker in tickers:
            normalized = ticker.upper()

            if normalized in _HALAL:
                status = "halal"
                score = 0.95
            elif normalized in _DOUBTFUL:
                status = "doubtful"
                score = 0.50
            else:
                status = "haram"
                score = 0.10

            results.append(
                ComplianceStatus(
                    ticker=normalized,
                    status=status,
                    confidence=1.0,
                    reason=_REASONS[status],
                    source=self.name,
                    score=score,
                    raw={
                        "source": self.name,
                        "mock": True,
                    },
                )
            )

        return results
