import secrets
from datetime import datetime, timedelta
from app.tasks.notifications import send_email

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def send_verification_email(email: str, token: str, frontend_url: str) -> None:
    link = f"{frontend_url}/verify-email?token={token}"
    send_email.delay(
        to=email,
        subject="Verify your Halal Trading account",
        body=f"Click to verify your email: {link}\n\nThis link expires in 24 hours.",
    )

def send_reset_email(email: str, token: str, frontend_url: str) -> None:
    link = f"{frontend_url}/reset-password?token={token}"
    send_email.delay(
        to=email,
        subject="Reset your Halal Trading password",
        body=f"Click to reset your password: {link}\n\nThis link expires in 1 hour.",
    )

def reset_token_expiry() -> datetime:
    return datetime.utcnow() + timedelta(hours=1)
