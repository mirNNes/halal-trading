import httpx

from app.brokers.base import BrokerClient, OrderResult


class AlpacaClient(BrokerClient):
    def __init__(self, api_key: str, api_secret: str, paper: bool = True):
        self._base = (
            "https://paper-api.alpaca.markets"
            if paper
            else "https://api.alpaca.markets"
        )
        self._headers = {
            "APCA-API-KEY-ID": api_key,
            "APCA-API-SECRET-KEY": api_secret,
            "Content-Type": "application/json",
        }

    async def _get(self, path: str):
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"{self._base}{path}",
                headers=self._headers,
                timeout=15,
            )
            r.raise_for_status()
            return r.json()

    async def _post(self, path: str, body: dict):
        async with httpx.AsyncClient() as client:
            r = await client.post(
                f"{self._base}{path}",
                json=body,
                headers=self._headers,
                timeout=15,
            )
            r.raise_for_status()
            return r.json()

    async def _delete(self, path: str):
        async with httpx.AsyncClient() as client:
            r = await client.delete(
                f"{self._base}{path}",
                headers=self._headers,
                timeout=15,
            )

            if r.status_code == 204:
                return None

            r.raise_for_status()
            return r.json()

    async def get_portfolio_value(self) -> float:
        account = await self._get("/v2/account")
        return float(account["portfolio_value"])

    async def get_account_info(self) -> dict:
        account = await self._get("/v2/account")

        return {
            "account_number": account.get("account_number"),
            "status": account.get("status"),
            "currency": account.get("currency"),
            "portfolio_value": float(account.get("portfolio_value") or 0),
            "buying_power": float(account.get("buying_power") or 0),
            "cash": float(account.get("cash") or 0),
            "equity": float(account.get("equity") or 0),
            "trading_blocked": account.get("trading_blocked"),
            "transfers_blocked": account.get("transfers_blocked"),
            "account_blocked": account.get("account_blocked"),
            "pattern_day_trader": account.get("pattern_day_trader"),
        }

    async def get_order(self, order_id: str) -> OrderResult:
        order = await self._get(f"/v2/orders/{order_id}")

        return OrderResult(
            broker_order_id=order["id"],
            status=order["status"],
            filled_qty=float(order.get("filled_qty") or 0),
            filled_price=float(order.get("filled_avg_price") or 0) or None,
        )

    async def get_position(self, ticker: str) -> float:
        try:
            pos = await self._get(f"/v2/positions/{ticker}")
            return float(pos["market_value"])
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return 0.0
            raise

    async def get_all_positions(self) -> dict[str, float]:
        positions = await self._get("/v2/positions")

        return {
            p["symbol"]: float(p["market_value"])
            for p in positions
        }

    async def place_fractional_order(
        self,
        ticker: str,
        side: str,
        notional_usd: float,
    ) -> OrderResult:
        if notional_usd < 1.0:
            return OrderResult(
                broker_order_id="",
                status="skipped",
                filled_qty=None,
                filled_price=None,
                error=f"Notional ${notional_usd:.2f} below $1 minimum",
            )

        try:
            order = await self._post(
                "/v2/orders",
                {
                    "symbol": ticker,
                    "notional": str(round(notional_usd, 2)),
                    "side": side.lower(),
                    "type": "market",
                    "time_in_force": "day",
                },
            )

            return OrderResult(
                broker_order_id=order["id"],
                status=order["status"],
                filled_qty=float(order.get("filled_qty") or 0),
                filled_price=float(order.get("filled_avg_price") or 0) or None,
            )

        except httpx.HTTPStatusError as e:
            return OrderResult(
                broker_order_id="",
                status="failed",
                filled_qty=None,
                filled_price=None,
                error=f"Alpaca error {e.response.status_code}: {e.response.text[:200]}",
            )

    async def liquidate_position(self, ticker: str) -> OrderResult:
        try:
            result = await self._delete(f"/v2/positions/{ticker}")

            if result is None:
                return OrderResult(
                    broker_order_id="",
                    status="no_position",
                    filled_qty=None,
                    filled_price=None,
                )

            return OrderResult(
                broker_order_id=result.get("id", ""),
                status=result.get("status", "submitted"),
                filled_qty=float(result.get("filled_qty") or 0),
                filled_price=float(result.get("filled_avg_price") or 0) or None,
            )

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return OrderResult(
                    broker_order_id="",
                    status="no_position",
                    filled_qty=None,
                    filled_price=None,
                )

            return OrderResult(
                broker_order_id="",
                status="failed",
                filled_qty=None,
                filled_price=None,
                error=f"Alpaca error {e.response.status_code}: {e.response.text[:200]}",
            )
