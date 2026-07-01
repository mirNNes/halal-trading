from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.core.database import get_db
from app.core.auth import current_user
from app.models.models import (
    User,
    BacktestRun,
    BacktestQuotaUsage,
    Strategy,
    Subscription,
    SubscriptionTier,
)
from app.tasks.backtest_runner import run_backtest

router = APIRouter()


class BacktestRequest(BaseModel):
    strategy_id: int
    start_date: date
    end_date: date
    starting_cash: int = 100000


@router.get("")
async def list_backtests(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun, Strategy)
        .join(Strategy, BacktestRun.strategy_id == Strategy.id)
        .where(BacktestRun.user_id == user.id)
        .order_by(BacktestRun.created_at.desc())
        .limit(50)
    )

    rows = result.all()

    return [
        {
            **run.__dict__,
            "strategy_name": strategy.name,
            "strategy_risk_profile": strategy.risk_profile,
        }
        for run, strategy in rows
    ]


@router.post("")
async def create_backtest(
    req: BacktestRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate strategy exists
    strategy = await db.get(Strategy, req.strategy_id)
    if not strategy or not strategy.is_active:
        raise HTTPException(404, "Strategy not found")

    # Validate date range
    if req.end_date <= req.start_date:
        raise HTTPException(400, "end_date must be after start_date")

    if req.starting_cash < 10000:
        raise HTTPException(400, "Minimum starting cash is $10,000")

    # Get user tier
    sub_result = await db.execute(
        select(Subscription, SubscriptionTier)
        .join(SubscriptionTier)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
        )
    )

    row = sub_result.first()
    quota = row[1].backtest_quota if row else 3

    # Atomic quota check + increment
    period_start = date.today().replace(day=1)

    usage_result = await db.execute(
        text("""
            INSERT INTO backtest_quota_usage (user_id, period_start, count)
            VALUES (:uid, :period, 1)
            ON CONFLICT (user_id, period_start)
            DO UPDATE SET count = backtest_quota_usage.count + 1
            RETURNING count
        """),
        {"uid": user.id, "period": period_start},
    )

    count = usage_result.scalar()

    if quota != -1 and count > quota:
        await db.execute(
            text("""
                UPDATE backtest_quota_usage
                SET count = count - 1
                WHERE user_id = :uid
                AND period_start = :period
            """),
            {"uid": user.id, "period": period_start},
        )

        await db.commit()

        raise HTTPException(
            402,
            detail={
                "error": "quota_exceeded",
                "quota": quota,
                "used": count - 1,
            },
        )

    run = BacktestRun(
        user_id=user.id,
        strategy_id=req.strategy_id,
        start_date=req.start_date,
        end_date=req.end_date,
        starting_cash=req.starting_cash,
        status="pending",
    )

    db.add(run)
    await db.commit()
    await db.refresh(run)

    run_backtest.delay(run.id)

    return {
        "backtest_id": run.id,
        "status": "pending",
    }


@router.get("/quota")
async def get_quota(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    sub_result = await db.execute(
        select(Subscription, SubscriptionTier)
        .join(SubscriptionTier)
        .where(
            Subscription.user_id == user.id,
            Subscription.status == "active",
        )
    )

    row = sub_result.first()
    quota = row[1].backtest_quota if row else 3

    period_start = date.today().replace(day=1)

    usage = await db.execute(
        select(BacktestQuotaUsage).where(
            BacktestQuotaUsage.user_id == user.id,
            BacktestQuotaUsage.period_start == period_start,
        )
    )

    usage_row = usage.scalar_one_or_none()
    used = usage_row.count if usage_row else 0

    return {
        "used": used,
        "limit": quota,
        "isUnlimited": quota == -1,
    }


@router.get("/{backtest_id}")
async def get_backtest(
    backtest_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BacktestRun, Strategy)
        .join(Strategy, BacktestRun.strategy_id == Strategy.id)
        .where(
            BacktestRun.id == backtest_id,
            BacktestRun.user_id == user.id,
        )
    )

    row = result.first()

    if not row:
        raise HTTPException(404)

    run, strategy = row

    return {
        **run.__dict__,
        "strategy_name": strategy.name,
        "strategy_risk_profile": strategy.risk_profile,
    }
