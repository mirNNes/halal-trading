from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token, current_user
from app.core.config import settings
from app.models.models import User
from app.services.email import generate_token, send_verification_email, send_reset_email, reset_token_expiry

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/register", status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    if len(req.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    existing = await db.execute(select(User).where(User.email == req.email))
    if existing.scalar_one_or_none():
        raise HTTPException(400, "Email already registered")

    token = generate_token()
    user = User(
        email=req.email,
        hashed_password=hash_password(req.password),
        verification_token=token,
        email_verified=False,
    )
    db.add(user)
    await db.commit()

    send_verification_email(req.email, token, settings.FRONTEND_URL)

    return {"message": "Check your email to verify your account"}


@router.post("/login")
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Invalid credentials")

    if not user.email_verified:
        raise HTTPException(403, "Please verify your email before signing in")

    return {"access_token": create_access_token(user.id), "token_type": "bearer"}


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.verification_token == token))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(400, "Invalid or expired verification token")

    user.email_verified = True
    user.verification_token = None
    await db.commit()

    return {"message": "Email verified"}


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    # Always return 200 to prevent email enumeration
    if user and user.email_verified:
        token = generate_token()
        user.reset_token = token
        user.reset_token_expires = reset_token_expiry()
        await db.commit()
        send_reset_email(req.email, token, settings.FRONTEND_URL)

    return {"message": "If that email is registered you will receive a reset link"}


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    if len(req.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    result = await db.execute(select(User).where(User.reset_token == req.token))
    user = result.scalar_one_or_none()

    if not user or not user.reset_token_expires or user.reset_token_expires < datetime.utcnow():
        raise HTTPException(400, "Reset link is invalid or has expired")

    user.hashed_password = hash_password(req.password)
    user.reset_token = None
    user.reset_token_expires = None
    await db.commit()

    return {"message": "Password updated"}


@router.get("/me")
async def get_me(user: User = Depends(current_user)):
    return {"id": user.id, "email": user.email, "emailVerified": user.email_verified}
