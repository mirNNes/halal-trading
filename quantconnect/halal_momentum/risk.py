from AlgorithmImports import *


class RiskManager:
    """
    Position sizing and portfolio-level risk controls.
    """

    def __init__(self, algorithm: QCAlgorithm, max_positions: int = 20, max_position_pct: float = 0.10):
        self._algo = algorithm
        self.max_positions = max_positions
        self.max_position_pct = max_position_pct  # max % of portfolio per stock

    def target_weight(self, num_stocks: int) -> float:
        """Equal-weight target, capped at max_position_pct."""
        if num_stocks == 0:
            return 0.0
        equal = 1.0 / num_stocks
        return min(equal, self.max_position_pct)

    def should_liquidate_portfolio(self) -> bool:
        """
        True if total portfolio drawdown exceeds 20% from its peak.
        Prevents riding a catastrophic loss through a bad period.
        """
        peak = self._algo.statistics.get("Total Peak Value")
        if peak is None:
            return False
        current = float(self._algo.portfolio.total_portfolio_value)
        peak_val = float(peak)
        if peak_val == 0:
            return False
        drawdown = (peak_val - current) / peak_val
        return drawdown > 0.20

    def position_too_large(self, symbol: Symbol) -> bool:
        holding = self._algo.portfolio[symbol]
        pct = abs(holding.holdings_value) / self._algo.portfolio.total_portfolio_value
        return pct > self.max_position_pct * 1.5  # allow 50% drift before trimming
