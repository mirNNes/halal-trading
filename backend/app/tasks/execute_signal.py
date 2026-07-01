"""
Executes signals and rebalance payloads against connected broker accounts.
Called as a background task after webhook receipt.
"""
import asyncio
from datetime import datetime

from celery_worker import celery
from sqlalchemy import select

from app.brokers.factory import get_broker_client
from app.core.database import AsyncSessionLocal
from app.models.models import BrokerConnection, ExecutionOrder, Signal


@celery.task(name="app.tasks.execute_signal.execute_signal_for_all")
def execute_signal_for_all(signal_id: int):
    asyncio.run(_execute_signal(signal_id))


@celery.task(name="app.tasks.execute_signal.execute_rebalance_for_all")
def execute_rebalance_for_all(strategy_id: int, weights: dict, timestamp: str):
    asyncio.run(_execute_rebalance(strategy_id, weights, timestamp))


@celery.task(name="app.tasks.execute_signal.sync_order_statuses")
def sync_order_statuses():
    asyncio.run(_sync_order_statuses())


async def _execute_signal(signal_id: int):
    async with AsyncSessionLocal() as db:
        signal = await db.get(Signal, signal_id)

        if not signal or signal.action not in ("BUY", "SELL"):
            return

        result = await db.execute(
            select(BrokerConnection).where(
                BrokerConnection.auto_execute == True,
                BrokerConnection.is_active == True,
                BrokerConnection.execution_mode == "signals",
            )
        )

        connections = result.scalars().all()

        for conn in connections:
            await _place_signal_order(db, conn, signal)


async def _place_signal_order(db, conn: BrokerConnection, signal: Signal):
    client = get_broker_client(
        conn.broker,
        conn.api_key_encrypted,
        conn.api_secret_encrypted,
        conn.paper,
    )

    try:
        if signal.action == "BUY":
            notional = float(conn.allocation_usd) * 0.10
            result = await client.place_fractional_order(
                signal.ticker,
                "buy",
                notional,
            )
        elif signal.action == "SELL":
            result = await client.liquidate_position(signal.ticker)
        else:
            return

        order = ExecutionOrder(
            user_id=conn.user_id,
            signal_id=signal.id,
            broker=conn.broker,
            ticker=signal.ticker,
            action=signal.action,
            notional_usd=(
                float(conn.allocation_usd) * 0.10
                if signal.action == "BUY"
                else None
            ),
            broker_order_id=result.broker_order_id,
            status=result.status,
            filled_qty=result.filled_qty,
            filled_price=result.filled_price,
            error_message=result.error,
            submitted_at=datetime.utcnow(),
        )

        db.add(order)
        await db.commit()

    except Exception as e:
        order = ExecutionOrder(
            user_id=conn.user_id,
            signal_id=signal.id,
            broker=conn.broker,
            ticker=signal.ticker,
            action=signal.action,
            status="error",
            error_message=str(e)[:500],
            submitted_at=datetime.utcnow(),
        )

        db.add(order)
        await db.commit()


async def _execute_rebalance(strategy_id: int, weights: dict, timestamp: str):
    """
    For each user in "rebalance" mode:
    1. Fetch their current Alpaca positions
    2. Calculate target positions based on their allocation_usd * weight
    3. Sell positions not in target, buy/adjust positions that are
    """
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(BrokerConnection).where(
                BrokerConnection.auto_execute == True,
                BrokerConnection.is_active == True,
                BrokerConnection.execution_mode == "rebalance",
            )
        )

        connections = result.scalars().all()

        for conn in connections:
            await _apply_rebalance(db, conn, strategy_id, weights, timestamp)


async def _apply_rebalance(
    db,
    conn: BrokerConnection,
    strategy_id: int,
    weights: dict,
    timestamp: str,
):
    client = get_broker_client(
        conn.broker,
        conn.api_key_encrypted,
        conn.api_secret_encrypted,
        conn.paper,
    )

    try:
        current_positions = await client.get_all_positions()
        allocation = conn.allocation_usd

        targets = {
            ticker: allocation * weight
            for ticker, weight in weights.items()
        }

        orders_placed = []

        for ticker, current_value in current_positions.items():
            if ticker not in targets and current_value > 1.0:
                result = await client.liquidate_position(ticker)

                orders_placed.append(
                    ExecutionOrder(
                        user_id=conn.user_id,
                        broker=conn.broker,
                        ticker=ticker,
                        action="SELL",
                        notional_usd=current_value,
                        broker_order_id=result.broker_order_id,
                        status=result.status,
                        filled_qty=result.filled_qty,
                        filled_price=result.filled_price,
                        error_message=result.error,
                        submitted_at=datetime.utcnow(),
                        rebalance_strategy_id=strategy_id,
                    )
                )

        for ticker, target_value in targets.items():
            current_value = current_positions.get(ticker, 0.0)
            diff = target_value - current_value

            if abs(diff) < 10 or abs(diff) / target_value < 0.02:
                continue

            if diff > 0:
                result = await client.place_fractional_order(ticker, "buy", diff)
            else:
                result = await client.place_fractional_order(ticker, "sell", abs(diff))

            orders_placed.append(
                ExecutionOrder(
                    user_id=conn.user_id,
                    broker=conn.broker,
                    ticker=ticker,
                    action="BUY" if diff > 0 else "SELL",
                    notional_usd=abs(diff),
                    broker_order_id=result.broker_order_id,
                    status=result.status,
                    filled_qty=result.filled_qty,
                    filled_price=result.filled_price,
                    error_message=result.error,
                    submitted_at=datetime.utcnow(),
                    rebalance_strategy_id=strategy_id,
                )
            )

        for order in orders_placed:
            db.add(order)

        await db.commit()

    except Exception as e:
        error_order = ExecutionOrder(
            user_id=conn.user_id,
            broker=conn.broker,
            ticker="PORTFOLIO",
            action="REBALANCE",
            status="error",
            error_message=str(e)[:500],
            submitted_at=datetime.utcnow(),
            rebalance_strategy_id=strategy_id,
        )

        db.add(error_order)
        await db.commit()


async def _sync_order_statuses():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(ExecutionOrder).where(
                ExecutionOrder.broker_order_id.isnot(None),
                ExecutionOrder.status.in_(
                    [
                        "accepted",
                        "new",
                        "pending_new",
                        "partially_filled",
                        "pending_cancel",
                    ]
                ),
            )
        )

        orders = result.scalars().all()

        for order in orders:
            conn_result = await db.execute(
                select(BrokerConnection).where(
                    BrokerConnection.user_id == order.user_id,
                    BrokerConnection.broker == order.broker,
                    BrokerConnection.is_active == True,
                )
            )

            conn = conn_result.scalar_one_or_none()

            if not conn:
                continue

            client = get_broker_client(
                conn.broker,
                conn.api_key_encrypted,
                conn.api_secret_encrypted,
                conn.paper,
            )

            try:
                latest = await client.get_order(order.broker_order_id)

                order.status = latest.status
                order.filled_qty = latest.filled_qty
                order.filled_price = latest.filled_price

                if latest.status == "filled":
                    order.filled_at = datetime.utcnow()

            except Exception as e:
                order.error_message = str(e)[:500]

        await db.commit()
