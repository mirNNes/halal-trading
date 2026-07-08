from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/halal_trading"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    QC_USER_ID: str = ""
    QC_API_TOKEN: str = ""
    QC_WEBHOOK_SECRET: str = "change-me"

    COMPLIANCE_PROVIDER: str = "mock"  # "mock" | "zoya"
    ZOYA_API_KEY: str = ""
    
    MARKET_DATA_PROVIDER: str = "alpaca"
    ALPACA_API_KEY: str = ""
    ALPACA_API_SECRET: str = ""
    ALPACA_DATA_BASE_URL: str = "https://data.alpaca.markets"

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_STARTER: str = ""
    STRIPE_PRICE_PRO: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    BROKER_ENCRYPTION_KEY: str = ""  # generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    RESEND_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
