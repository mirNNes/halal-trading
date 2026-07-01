import asyncio
import hashlib
from datetime import datetime
from celery_worker import celery
from app.core.database import AsyncSessionLocal
from app.models.models import BacktestRun, Strategy
from app.services.quantconnect import QuantConnectClient
from app.tasks.local_backtest import run_local_backtest
from sqlalchemy import select

@celery.task(bind=True, max_retries=3, name="app.tasks.backtest_runner.run_backtest")
def run_backtest(self, backtest_run_id: int):
    asyncio.run(_run(self, backtest_run_id))

async def _run(task, backtest_run_id: int):
    async with AsyncSessionLocal() as db:
        run = await db.get(BacktestRun, backtest_run_id)
        strategy = await db.get(Strategy, run.strategy_id)
        if not strategy.qc_project_id:
            await run_local_backtest(db, run)
            return
        qc = QuantConnectClient()

        try:
            compile_id = await _get_or_compile(qc, db, strategy)

            backtest = await qc.create_backtest(
                project_id=int(strategy.qc_project_id),
                compile_id=compile_id,
                name=f"run-{run.id}-user-{run.user_id}",
                parameters={
                    "start-date": run.start_date.isoformat(),
                    "end-date": run.end_date.isoformat(),
                    "cash": str(run.starting_cash),
                    "strategy-id": str(strategy.id),
                },
            )

            run.status = "running"
            run.qc_backtest_id = backtest["backtestId"]
            await db.commit()

            poll_backtest.apply_async(args=[backtest_run_id], countdown=45)

        except Exception as exc:
            run.status = "failed"
            run.error_message = str(exc)
            await db.commit()
            raise task.retry(exc=exc, countdown=60)

async def _get_or_compile(qc: QuantConnectClient, db, strategy: Strategy) -> str:
    if strategy.compile_id:
        return strategy.compile_id

    compile_resp = await qc.compile_project(int(strategy.qc_project_id))
    compile_id = compile_resp["compileId"]

    for _ in range(30):
        result = await qc.read_compile(int(strategy.qc_project_id), compile_id)
        state = result.get("state", "")
        if state == "BuildSuccess":
            strategy.compile_id = compile_id
            strategy.compiled_at = datetime.utcnow()
            await db.commit()
            return compile_id
        if state == "BuildError":
            raise RuntimeError(f"QC compile failed: {result.get('logs', '')}")
        await asyncio.sleep(2)

    raise TimeoutError("QC compile timed out")


@celery.task(bind=True, max_retries=30, name="app.tasks.backtest_runner.poll_backtest")
def poll_backtest(self, backtest_run_id: int):
    asyncio.run(_poll(self, backtest_run_id))

async def _poll(task, backtest_run_id: int):
    async with AsyncSessionLocal() as db:
        run = await db.get(BacktestRun, backtest_run_id)
        strategy = await db.get(Strategy, run.strategy_id)
        qc = QuantConnectClient()

        result = await qc.read_backtest(int(strategy.qc_project_id), run.qc_backtest_id)
        backtest_data = result.get("backtest", {})

        if not backtest_data.get("completed", False):
            raise task.retry(countdown=20)

        stats = backtest_data.get("statistics", {})

        def pct(key: str) -> float:
            val = stats.get(key, "0%").strip().rstrip("%")
            try:
                return float(val) / 100
            except ValueError:
                return 0.0

        run.status = "completed"
        run.result_json = backtest_data
        run.completed_at = datetime.utcnow()
        run.total_return = pct("Total Return")
        run.annual_return = pct("Compounding Annual Return")
        run.sharpe_ratio = float(stats.get("Sharpe Ratio", "0") or "0")
        run.max_drawdown = pct("Drawdown")
        run.win_rate = pct("Win Rate")
        run.num_trades = int(stats.get("Total Trades", "0") or "0")

        await db.commit()

        from app.tasks.notifications import notify_backtest_complete
        notify_backtest_complete.delay(backtest_run_id)
