import json
import hashlib
import hmac
from AlgorithmImports import *


class WebhookNotifier:
    def __init__(self, algorithm: QCAlgorithm, webhook_url: str, secret: str, strategy_id: str):
        self._algo = algorithm
        self._url = webhook_url
        self._secret = secret
        self._strategy_id = strategy_id

    def send_signal(self, symbol: Symbol, action: str, reason: str) -> None:
        payload = {
            "type": "signal",
            "strategy_id": self._strategy_id,
            "symbol": str(symbol.value),
            "action": action,
            "reason": reason,
            "timestamp": self._algo.utc_time.isoformat(),
        }
        payload["hmac"] = self._sign_signal(payload)
        self._algo.notify.web(self._url, json.dumps(payload))

    def send_rebalance(self, weights: dict) -> None:
        """weights: {ticker_str: float} e.g. {"AAPL": 0.05, "MSFT": 0.05}"""
        payload = {
            "type": "rebalance",
            "strategy_id": self._strategy_id,
            "weights": weights,
            "timestamp": self._algo.utc_time.isoformat(),
        }
        payload["hmac"] = self._sign_rebalance(payload)
        self._algo.notify.web(self._url, json.dumps(payload))

    def _sign_signal(self, payload: dict) -> str:
        canonical = f"{payload['strategy_id']}:{payload['symbol']}:{payload['action']}:{payload['timestamp']}"
        return hmac.new(self._secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()

    def _sign_rebalance(self, payload: dict) -> str:
        tickers = ",".join(sorted(payload["weights"].keys()))
        canonical = f"{payload['strategy_id']}:rebalance:{tickers}:{payload['timestamp']}"
        return hmac.new(self._secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()
