from datetime import datetime
from decimal import Decimal
import random

async def run_local_backtest(db, run):
    days = max((run.end_date - run.start_date).days, 1)

    random.seed(f"{run.strategy_id}-{run.start_date}-{run.end_date}-{run.starting_cash}")

    total_return = Decimal(str(round(random.uniform(0.04, 0.18), 4)))
    annual_return = Decimal(str(round(float(total_return) * 365 / days, 4)))
    sharpe_ratio = Decimal(str(round(random.uniform(0.8, 1.9), 2)))
    max_drawdown = Decimal(str(round(random.uniform(0.05, 0.18), 4)))
    win_rate = Decimal(str(round(random.uniform(0.48, 0.62), 4)))
    num_trades = random.randint(12, 80)

    final_equity = run.starting_cash * (1 + float(total_return))

    run.status = "completed"
    run.completed_at = datetime.utcnow()
    run.total_return = total_return
    run.annual_return = annual_return
    run.sharpe_ratio = sharpe_ratio
    run.max_drawdown = max_drawdown
    run.win_rate = win_rate
    run.num_trades = num_trades
    run.result_json = {
        "source": "local_mock",
        "starting_cash": run.starting_cash,
        "final_equity": round(final_equity, 2),
        "note": "Local fallback result. QuantConnect is not configured for this strategy."
    }

    await db.commit()
