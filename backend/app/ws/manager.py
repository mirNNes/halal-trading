import json
import asyncio
import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.core.config import settings
from app.core.auth import create_access_token
from jose import jwt, JWTError

ws_router = APIRouter()

@ws_router.websocket("/ws/signals")
async def ws_signals(websocket: WebSocket, token: str = Query(...)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, [settings.ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await websocket.close(code=4001)
        return

    await websocket.accept()

    r = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    pubsub = r.pubsub()
    await pubsub.psubscribe("strategy:*:signals")

    try:
        async for message in pubsub.listen():
            if message["type"] == "pmessage":
                await websocket.send_text(message["data"])
    except WebSocketDisconnect:
        pass
    finally:
        await pubsub.unsubscribe()
        await r.aclose()
