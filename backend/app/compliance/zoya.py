import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from app.compliance.base import ComplianceProvider, ComplianceStatus
from app.core.config import settings

class ZoyaProvider(ComplianceProvider):
    name = "zoya"
    # Fill in the correct base URL and endpoints once you have API access
    BASE_URL = "https://api.zoya.finance/graphql"

    def __init__(self):
        self.api_key = settings.ZOYA_API_KEY

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def get_batch_status(self, tickers: list[str]) -> list[ComplianceStatus]:
        # TODO: implement once Zoya API structure is confirmed
        # Expected: POST with list of tickers, returns compliance statuses
        raise NotImplementedError("Zoya integration pending API access")


def get_provider() -> ComplianceProvider:
    if settings.COMPLIANCE_PROVIDER == "zoya":
        return ZoyaProvider()
    return MockProvider()  # noqa: F821 — imported below

from app.compliance.mock import MockProvider  # noqa: E402
