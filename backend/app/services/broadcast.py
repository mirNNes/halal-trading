import json
import redis.asyncio as aioredis
from app.core.config import settings

_redis: aioredis.Redis | None = None

async def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis

async def publish_signal(strategy_id: int, payload: dict) -> None:
    r = await get_redis()
    await r.publish(f"strategy:{strategy_id}:signals", json.dumps(payload))
