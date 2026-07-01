from celery import Celery
from app.core.config import settings

celery = Celery(
    "halal_trading",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=[
        "app.tasks.sync",
        "app.tasks.backtest_runner",
        "app.tasks.notifications",
        "app.tasks.execute_signal",
    ],
)

celery.conf.beat_schedule = {
    "sync-compliance-daily": {
        "task": "app.tasks.sync.sync_compliance_universe",
        "schedule": 86400,
    },
    "order-status-sync": {
        "task": "app.tasks.execute_signal.sync_order_statuses",
        "schedule": 60,
    },
}

celery.conf.timezone = "UTC"
