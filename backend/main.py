from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import universe, webhooks, backtests, signals, users, strategies
from app.api import stripe_routes
from app.api import brokers as broker_routes
from app.api.market_data import router as market_data_router
from app.ws.manager import ws_router
from app.api import executions

app = FastAPI(title="Halal Trading API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router,     prefix="/api/users",     tags=["users"])
app.include_router(universe.router,  prefix="/api/universe",  tags=["universe"])
app.include_router(webhooks.router,  prefix="/api/webhooks",  tags=["webhooks"])
app.include_router(backtests.router, prefix="/api/backtests", tags=["backtests"])
app.include_router(signals.router,   prefix="/api/signals",   tags=["signals"])
app.include_router(stripe_routes.router, prefix="/api/stripe", tags=["stripe"])
app.include_router(broker_routes.router, prefix="/api/brokers", tags=["brokers"])
app.include_router(executions.router, prefix="/api/executions", tags=["executions"])
app.include_router(strategies.router, prefix="/api/strategies", tags=["strategies"])
app.include_router( market_data_router, prefix="/api/market-data", tags=["Market Data"])
app.include_router(ws_router)

@app.get("/health")
def health():
    return {"status": "ok"}
