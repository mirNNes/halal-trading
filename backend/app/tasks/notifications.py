from celery_worker import celery


@celery.task(name="app.tasks.notifications.send_email")
def send_email(to: str, subject: str, body: str) -> None:
    # TODO: integrate SendGrid or AWS SES
    # import sendgrid / boto3 here
    # For now logs to stdout so dev flow works without email configured
    print(f"[EMAIL] To: {to} | Subject: {subject}\n{body}")


@celery.task(name="app.tasks.notifications.notify_backtest_complete")
def notify_backtest_complete(backtest_run_id: int) -> None:
    from app.core.database import AsyncSessionLocal
    from app.models.models import BacktestRun, User
    import asyncio

    async def _notify():
        async with AsyncSessionLocal() as db:
            run = await db.get(BacktestRun, backtest_run_id)
            if not run:
                return
            user = await db.get(User, run.user_id)
            if not user:
                return
            send_email.delay(
                to=user.email,
                subject="Your backtest is ready",
                body=f"Your backtest has completed.\n\nView results: {_frontend_url()}/backtests/{run.id}",
            )

    asyncio.run(_notify())


@celery.task(name="app.tasks.notifications.notify_subscribers")
def notify_subscribers(signal_id: int) -> None:
    # TODO: batch email to all active subscribers about new signal
    pass


def _frontend_url() -> str:
    from app.core.config import settings
    return settings.FRONTEND_URL
