"""
Halal Momentum Strategy
-----------------------
Universe:   Sharia-compliant stocks sourced from our backend compliance API.
Signal:     12-1 month price momentum (12-month return minus most recent month).
            Classic Jegadeesh-Titman momentum, applied to the halal universe.
Rebalance:  Monthly, first trading day after market open.
Sizing:     Equal weight across top-N momentum stocks, max 10% per position.
Compliance: Any stock removed from the halal universe is liquidated immediately,
            regardless of momentum rank.
"""

from AlgorithmImports import *
from universe import ZoyaHalalData
from risk import RiskManager
from notify import WebhookNotifier


class HalalMomentumStrategy(QCAlgorithm):

    # ------------------------------------------------------------------ #
    # Initialisation
    # ------------------------------------------------------------------ #

    def initialize(self):
        # --- User-supplied parameters (passed by backend at backtest creation) ---
        start      = self.get_parameter("start-date", "2020-01-01")
        end        = self.get_parameter("end-date",   "2024-01-01")
        cash       = int(self.get_parameter("cash",         "100000"))
        top_n      = int(self.get_parameter("top-n",        "20"))
        backend    = self.get_parameter("backend-url",      "https://your-app.com")
        webhook    = self.get_parameter("webhook-url",      f"{backend}/api/webhooks/quantconnect")
        secret     = self.get_parameter("webhook-secret",   "change-me")
        self._strategy_id = self.get_parameter("strategy-id", "1")

        # --- Algorithm dates + capital ---
        y, mo, d = [int(x) for x in start.split("-")]
        self.set_start_date(y, mo, d)
        y, mo, d = [int(x) for x in end.split("-")]
        self.set_end_date(y, mo, d)
        self.set_cash(cash)

        # --- Benchmark ---
        self.set_benchmark("SPY")

        # --- Brokerage model (realistic fills + commissions) ---
        self.set_brokerage_model(BrokerageName.INTERACTIVE_BROKERS_BROKERAGE, AccountType.MARGIN)

        # --- Universe ---
        ZoyaHalalData._base_url = backend
        self.add_universe(ZoyaHalalData, "HalalUniverse", Resolution.DAILY, self._universe_selector)
        self.universe_settings.resolution = Resolution.DAILY

        # --- Helpers ---
        self._risk      = RiskManager(self, max_positions=top_n)
        self._notifier  = WebhookNotifier(self, webhook, secret, self._strategy_id)
        self._top_n     = top_n

        # --- State ---
        self._halal_symbols: set[Symbol] = set()   # current compliant universe
        self._momentum: dict[Symbol, float] = {}   # latest momentum scores

        # --- Monthly rebalance schedule ---
        self.schedule.on(
            self.date_rules.month_start("SPY"),
            self.time_rules.after_market_open("SPY", 31),
            self._rebalance,
        )

        self.debug(f"Halal Momentum initialised | top_n={top_n} | {start} → {end}")

    # ------------------------------------------------------------------ #
    # Universe selection
    # ------------------------------------------------------------------ #

    def _universe_selector(self, data: list) -> list[Symbol]:
        self._halal_symbols = {d.symbol for d in data}
        return list(self._halal_symbols)

    # ------------------------------------------------------------------ #
    # Securities changed — compliance events
    # ------------------------------------------------------------------ #

    def on_securities_changed(self, changes: SecurityChanges):
        # A stock was removed from the halal universe — liquidate immediately
        for security in changes.removed_securities:
            sym = security.symbol
            if self.portfolio[sym].invested:
                self.liquidate(sym, "Compliance: removed from halal universe")
                self._notifier.send_signal(sym, "SELL", "Removed from halal universe")
                self.debug(f"LIQUIDATED {sym.value} — no longer halal")

        # New halal stocks: emit a WATCH signal; they will be ranked next rebalance
        for security in changes.added_securities:
            sym = security.symbol
            self._notifier.send_signal(sym, "WATCH", "Added to halal universe")

    # ------------------------------------------------------------------ #
    # Monthly rebalance
    # ------------------------------------------------------------------ #

    def _rebalance(self):
        if not self._halal_symbols:
            return

        self._momentum = self._compute_momentum(self._halal_symbols)
        if not self._momentum:
            return

        # Rank by momentum score descending, pick top N
        ranked = sorted(self._momentum, key=lambda s: self._momentum[s], reverse=True)
        targets = set(ranked[: self._top_n])

        # --- Sell positions that fell out of the top-N ---
        for sym in list(self.portfolio.keys()):
            if self.portfolio[sym].invested and sym not in targets:
                self.liquidate(sym, "Dropped from momentum top-N")
                self._notifier.send_signal(sym, "SELL", f"Dropped from top-{self._top_n} momentum ranking")

        # --- Buy / size existing top-N positions ---
        weight = self._risk.target_weight(len(targets))
        for sym in targets:
            self.set_holdings(sym, weight)
            if not self.portfolio[sym].invested:
                self._notifier.send_signal(
                    sym,
                    "BUY",
                    f"Top-{self._top_n} momentum | score={self._momentum[sym]:.3f} | weight={weight:.1%}",
                )

        # Post full weight map for broker auto-execution
        self._notifier.send_rebalance({
            str(sym.value): weight for sym in targets
        })
        self.debug(f"Rebalanced: {len(targets)} positions @ {weight:.1%} each")

    # ------------------------------------------------------------------ #
    # Momentum calculation  (12-1 month = ~252 - 21 trading days)
    # ------------------------------------------------------------------ #

    def _compute_momentum(self, symbols: set[Symbol]) -> dict[Symbol, float]:
        scores: dict[Symbol, float] = {}

        history = self.history(list(symbols), 253, Resolution.DAILY)
        if history.empty:
            return scores

        for sym in symbols:
            try:
                sym_history = history.loc[sym]["close"]
                if len(sym_history) < 253:
                    continue                          # not enough history

                price_now        = float(sym_history.iloc[-1])
                price_one_month  = float(sym_history.iloc[-22])   # ~1 month ago
                price_one_year   = float(sym_history.iloc[0])     # ~12 months ago

                if price_one_year == 0 or price_one_month == 0:
                    continue

                # 12-1 momentum: skip the most recent month to avoid short-term reversal
                score = (price_one_month - price_one_year) / price_one_year
                scores[sym] = score

            except Exception as e:
                self.debug(f"Momentum error for {sym.value}: {e}")
                continue

        return scores

    # ------------------------------------------------------------------ #
    # On data — real-time compliance guard (belt-and-suspenders)
    # ------------------------------------------------------------------ #

    def on_data(self, data: Slice):
        # Belt-and-suspenders: if we somehow still hold a non-halal stock, sell it
        for sym in list(self.portfolio.keys()):
            if self.portfolio[sym].invested and sym not in self._halal_symbols:
                self.liquidate(sym, "Compliance guard: not in halal universe")
                self._notifier.send_signal(sym, "SELL", "Compliance guard liquidation")
