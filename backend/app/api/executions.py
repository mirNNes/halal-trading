from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.auth import current_user
from app.models.models import User, ExecutionOrder

router = APIRouter()


@router.get("")
async def list_execution_orders(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ExecutionOrder)
        .where(ExecutionOrder.user_id == user.id)
        .order_by(desc(ExecutionOrder.submitted_at))
    )

    orders = result.scalars().all()

    return [
        {
            "id": order.id,
            "signal_id": order.signal_id,
            "rebalance_strategy_id": order.rebalance_strategy_id,
            "broker": order.broker,
            "ticker": order.ticker,
            "action": order.action,
            "notional_usd": float(order.notional_usd) if order.notional_usd is not None else None,
            "broker_order_id": order.broker_order_id,
            "status": order.status,
            "filled_qty": float(order.filled_qty) if order.filled_qty is not None else None,
            "filled_price": float(order.filled_price) if order.filled_price is not None else None,
            "error_message": order.error_message,
            "submitted_at": order.submitted_at,
            "filled_at": order.filled_at,
        }
        for order in orders
    ]
