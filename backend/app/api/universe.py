from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.core.database import get_db
from app.models.models import HalalUniverse

router = APIRouter()

@router.get("/halal.csv", response_class=PlainTextResponse)
async def halal_universe_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    start = start_date or date(2020, 1, 1)
    end = end_date or date.today()

    result = await db.execute(
        select(HalalUniverse)
        .where(HalalUniverse.date >= start, HalalUniverse.date <= end)
        .order_by(HalalUniverse.date, HalalUniverse.ticker)
    )
    rows = result.scalars().all()
    lines = "\n".join(f"{row.date},{row.ticker}" for row in rows)
    return lines
