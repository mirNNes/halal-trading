import hashlib
import hmac
import json
from datetime import datetime
import httpx
from app.core.config import settings

class QuantConnectClient:
    BASE = "https://www.quantconnect.com/api/v2"

    def __init__(self):
        self._auth = (settings.QC_USER_ID, settings.QC_API_TOKEN)

    async def _post(self, path: str, body: dict) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self.BASE}{path}", json=body, auth=self._auth, timeout=30
            )
            r.raise_for_status()
            data = r.json()
            if not data.get("success"):
                raise RuntimeError(f"QC API error on {path}: {data.get('errors', data)}")
            return data

    async def _get(self, path: str, params: dict = None) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self.BASE}{path}", params=params, auth=self._auth, timeout=30
            )
            r.raise_for_status()
            return r.json()

    async def compile_project(self, project_id: int) -> dict:
        return await self._post("/compile/create", {"projectId": project_id})

    async def read_compile(self, project_id: int, compile_id: str) -> dict:
        return await self._get("/compile/read", {"projectId": project_id, "compileId": compile_id})

    async def create_backtest(
        self,
        project_id: int,
        compile_id: str,
        name: str,
        parameters: dict[str, str],
    ) -> dict:
        return await self._post("/backtests/create", {
            "projectId": project_id,
            "compileId": compile_id,
            "backtestName": name,
            "parameters": parameters,
        })

    async def read_backtest(self, project_id: int, backtest_id: str) -> dict:
        return await self._get("/backtests/read", {
            "projectId": project_id,
            "backtestId": backtest_id,
        })

    async def delete_backtest(self, project_id: int, backtest_id: str) -> dict:
        return await self._post("/backtests/delete", {
            "projectId": project_id,
            "backtestId": backtest_id,
        })


def verify_qc_hmac(secret: str, body: bytes, signature: str) -> bool:
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)
