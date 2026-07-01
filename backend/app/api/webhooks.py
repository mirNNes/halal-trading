import json
import hashlib
import hmac as hmac_lib
from fastapi import APIRouter, Request, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import Depends
from datetime import datetime
from app.core.database import get_db
from app.core.config import settings
from app.models.models import Signal, Strategy
from app.services.broadcast import publish_signal
from app.tasks.notifications import notify_subscribers

router = APIRouter()


def _verify_payload_hmac(payload: dict) -> bool:
    received = payload.get("hmac", "")
    canonical = f"{payload.get('strategy_id')}:{payload.get('symbol')}:{payload.get('action')}:{payload.get('timestamp')}"
    expected = hmac_lib.new(
        settings.QC_WEBHOOK_SECRET.encode(),
        canonical.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac_lib.compare_digest(expected, received)


@router.post("/quantconnect")
async def receive_qc_signal(
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    # Route rebalance payloads separately
    if payload.get("type") == "rebalance":
        if not _verify_payload_hmac(payload):
            raise HTTPException(status_code=403, detail="Invalid HMAC signature")
        from app.tasks.execute_signal import execute_rebalance_for_all
        background_tasks.add_task(
            execute_rebalance_for_all.delay,
            int(payload.get("strategy_id", 0)),
            payload.get("weights", {}),
            payload.get("timestamp", ""),
        )
        return {"status": "accepted"}

    if not _verify_payload_hmac(payload):
        raise HTTPException(status_code=403, detail="Invalid HMAC signature")

    strategy_result = await db.execute(
        select(Strategy).where(Strategy.id == int(payload.get("strategy_id", 0)))
    )
    strategy = strategy_result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    signal = Signal(
        strategy_id=strategy.id,
        ticker=payload["symbol"],
        action=payload["action"],
        reason=payload.get("reason", ""),
        emitted_at=datetime.fromisoformat(payload["timestamp"]),
    )
    db.add(signal)
    await db.commit()
    await db.refresh(signal)

    background_tasks.add_task(publish_signal, strategy.id, {
        "id": signal.id,
        "strategyId": signal.strategy_id,
        "ticker": signal.ticker,
        "action": signal.action,
        "reason": signal.reason,
        "emittedAt": signal.emitted_at.isoformat(),
    })
    background_tasks.add_task(notify_subscribers.delay, signal.id)

    # Dispatch to auto-execute broker connections
    from app.tasks.execute_signal import execute_signal_for_all
    background_tasks.add_task(execute_signal_for_all.delay, signal.id)

    return {"status": "accepted"}
