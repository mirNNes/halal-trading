from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import current_user
from app.core.database import get_db
from app.models.models import Strategy, User


router = APIRouter()

VALID_RISK_PROFILES = ("low", "medium", "high")


class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    risk_profile: str = "medium"
    qc_project_id: Optional[str] = None


class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    risk_profile: Optional[str] = None
    qc_project_id: Optional[str] = None
    is_active: Optional[bool] = None


def validate_risk_profile(risk_profile: Optional[str]) -> None:
    if risk_profile is not None and risk_profile not in VALID_RISK_PROFILES:
        raise HTTPException(
            status_code=400,
            detail="risk_profile must be low, medium, or high",
        )


@router.get("")
async def list_strategies(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy)
        .where(Strategy.is_active == True)
        .order_by(Strategy.id.asc())
    )
    return result.scalars().all()


@router.get("/{strategy_id}")
async def get_strategy(
    strategy_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = await db.get(Strategy, strategy_id)

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    return strategy


@router.post("")
async def create_strategy(
    req: StrategyCreate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    validate_risk_profile(req.risk_profile)

    strategy = Strategy(
        name=req.name,
        description=req.description,
        risk_profile=req.risk_profile,
        qc_project_id=req.qc_project_id,
        is_active=True,
        is_live=False,
    )

    db.add(strategy)
    await db.commit()
    await db.refresh(strategy)

    return strategy


@router.put("/{strategy_id}")
async def replace_strategy(
    strategy_id: int,
    req: StrategyUpdate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = await db.get(Strategy, strategy_id)

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    validate_risk_profile(req.risk_profile)

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(strategy, field, value)

    await db.commit()
    await db.refresh(strategy)

    return strategy


@router.patch("/{strategy_id}")
async def update_strategy(
    strategy_id: int,
    req: StrategyUpdate,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = await db.get(Strategy, strategy_id)

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    validate_risk_profile(req.risk_profile)

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(strategy, field, value)

    await db.commit()
    await db.refresh(strategy)

    return strategy


@router.patch("/{strategy_id}/toggle-active")
async def toggle_strategy_active(
    strategy_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = await db.get(Strategy, strategy_id)

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy.is_active = not strategy.is_active

    await db.commit()
    await db.refresh(strategy)

    return strategy


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = await db.get(Strategy, strategy_id)

    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    strategy.is_active = False

    await db.commit()
    await db.refresh(strategy)

    return strategy
