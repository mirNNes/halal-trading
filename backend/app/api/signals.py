from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_user
from app.core.database import get_db
from app.models.models import User, Signal, Strategy, Subscription, SubscriptionTier
from app.tasks.execute_signal import execute_signal_for_all

router = APIRouter()


@router.get("")
async def get_signals(
    strategy_id: Optional[int] = Query(None),
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(
        select(SubscriptionTier)
        .join(Subscription)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
        )
    )

    tier = sub_result.scalar_one_or_none()
    live_enabled = tier.live_signals_enabled if tier else False

    delay = timedelta(hours=0) if live_enabled else timedelta(hours=24)
    cutoff = datetime.utcnow() - delay

    q = (
        select(Signal, Strategy)
        .join(Strategy, Signal.strategy_id == Strategy.id)
        .where(Signal.emitted_at <= cutoff)
    )

    if strategy_id is not None:
        q = q.where(Signal.strategy_id == strategy_id)

    q = q.order_by(Signal.emitted_at.desc()).limit(50)

    result = await db.execute(q)

    return [
        {
            "id": signal.id,
            "strategy_id": signal.strategy_id,
            "strategy_name": strategy.name,
            "strategy_risk_profile": strategy.risk_profile,
            "ticker": signal.ticker,
            "action": signal.action,
            "reason": signal.reason,
            "emitted_at": signal.emitted_at,
        }
        for signal, strategy in result.all()
    ]


@router.post("/{signal_id}/execute")
async def execute_signal_now(
    signal_id: int,
    user: User = Depends(current_user),
):
    execute_signal_for_all.delay(signal_id)

    return {
        "status": "queued",
        "signal_id": signal_id,
    }
