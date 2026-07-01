from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.brokers.crypto import encrypt
from app.brokers.factory import get_broker_client
from app.core.auth import current_user
from app.core.database import get_db
from app.models.models import User, BrokerConnection

router = APIRouter()


class ConnectRequest(BaseModel):
    broker: str = "alpaca"
    api_key: str
    api_secret: str
    paper: bool = True
    allocation_usd: float
    execution_mode: str = "rebalance"


class UpdateRequest(BaseModel):
    allocation_usd: float | None = None
    execution_mode: str | None = None
    auto_execute: bool | None = None


class TestConnectionRequest(BaseModel):
    broker: str = "alpaca"
    api_key: str
    api_secret: str
    paper: bool = True


@router.get("")
async def list_connections(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrokerConnection).where(BrokerConnection.user_id == user.id)
    )

    conns = result.scalars().all()

    return [
        {
            "id": c.id,
            "broker": c.broker,
            "paper": c.paper,
            "allocation_usd": c.allocation_usd,
            "execution_mode": c.execution_mode,
            "auto_execute": c.auto_execute,
            "is_active": c.is_active,
            "created_at": c.created_at,
        }
        for c in conns
    ]


@router.get("/account")
async def get_broker_account(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrokerConnection).where(
            BrokerConnection.user_id == user.id,
            BrokerConnection.is_active == True,
        )
    )

    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(404, "No active broker connection found")

    try:
        client = get_broker_client(
            conn.broker,
            conn.api_key_encrypted,
            conn.api_secret_encrypted,
            conn.paper,
        )

        account_info = await client.get_account_info()

        return {
            "broker": conn.broker,
            "paper": conn.paper,
            "account": account_info,
        }

    except Exception as e:
        raise HTTPException(
            400,
            f"Could not fetch broker account: {str(e)[:200]}",
        )

@router.get("/positions")
async def get_broker_positions(
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrokerConnection).where(
            BrokerConnection.user_id == user.id,
            BrokerConnection.is_active == True,
        )
    )

    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(404, "No active broker connection found")

    try:
        client = get_broker_client(
            conn.broker,
            conn.api_key_encrypted,
            conn.api_secret_encrypted,
            conn.paper,
        )

        positions = await client.get_all_positions()

        return {
            "broker": conn.broker,
            "paper": conn.paper,
            "positions": positions,
        }

    except Exception as e:
        raise HTTPException(
            400,
            f"Could not fetch broker positions: {str(e)[:200]}",
)
    
@router.post("/test-connection")
async def test_broker_connection(
    req: TestConnectionRequest,
    user: User = Depends(current_user),
):
    if req.broker not in ("alpaca",):
        raise HTTPException(400, "Unsupported broker")

    try:
        from app.brokers.alpaca import AlpacaClient

        client = AlpacaClient(
            req.api_key,
            req.api_secret,
            paper=req.paper,
        )

        account_info = await client.get_account_info()

        return {
            "broker": req.broker,
            "paper": req.paper,
            "account": account_info,
        }

    except Exception as e:
        raise HTTPException(
            400,
            f"Could not connect to {req.broker}: {str(e)[:200]}",
        )


@router.post("")
async def connect_broker(
    req: ConnectRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    if req.broker not in ("alpaca",):
        raise HTTPException(400, "Unsupported broker")

    if req.execution_mode not in ("rebalance", "signals"):
        raise HTTPException(400, "execution_mode must be 'rebalance' or 'signals'")

    if req.allocation_usd < 100:
        raise HTTPException(400, "Minimum allocation is $100")

    try:
        from app.brokers.alpaca import AlpacaClient

        test_client = AlpacaClient(
            req.api_key,
            req.api_secret,
            paper=req.paper,
        )

        account_info = await test_client.get_account_info()

    except Exception as e:
        raise HTTPException(
            400,
            f"Could not connect to {req.broker}: {str(e)[:100]}",
        )

    existing = await db.execute(
        select(BrokerConnection).where(
            BrokerConnection.user_id == user.id,
            BrokerConnection.broker == req.broker,
        )
    )

    for conn in existing.scalars().all():
        conn.is_active = False

    conn = BrokerConnection(
        user_id=user.id,
        broker=req.broker,
        api_key_encrypted=encrypt(req.api_key),
        api_secret_encrypted=encrypt(req.api_secret),
        paper=req.paper,
        allocation_usd=req.allocation_usd,
        execution_mode=req.execution_mode,
        auto_execute=True,
        is_active=True,
    )

    db.add(conn)
    await db.commit()
    await db.refresh(conn)

    return {
        "id": conn.id,
        "broker": conn.broker,
        "paper": conn.paper,
        "account": account_info,
        "allocation_usd": conn.allocation_usd,
        "execution_mode": conn.execution_mode,
    }


@router.patch("/{connection_id}")
async def update_connection(
    connection_id: int,
    req: UpdateRequest,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrokerConnection).where(
            BrokerConnection.id == connection_id,
            BrokerConnection.user_id == user.id,
        )
    )

    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(404)

    if req.allocation_usd is not None:
        if req.allocation_usd < 100:
            raise HTTPException(400, "Minimum allocation is $100")
        conn.allocation_usd = req.allocation_usd

    if req.execution_mode is not None:
        if req.execution_mode not in ("rebalance", "signals"):
            raise HTTPException(400, "execution_mode must be 'rebalance' or 'signals'")
        conn.execution_mode = req.execution_mode

    if req.auto_execute is not None:
        conn.auto_execute = req.auto_execute

    await db.commit()

    return {"status": "updated"}


@router.delete("/{connection_id}")
async def disconnect_broker(
    connection_id: int,
    user: User = Depends(current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(BrokerConnection).where(
            BrokerConnection.id == connection_id,
            BrokerConnection.user_id == user.id,
        )
    )

    conn = result.scalar_one_or_none()

    if not conn:
        raise HTTPException(404)

    conn.is_active = False

    await db.commit()

    return {"status": "disconnected"}
