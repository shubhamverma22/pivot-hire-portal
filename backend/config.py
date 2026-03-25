from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "PivotHire API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/pivothire"

    # JWT
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""
    RAZORPAY_WEBHOOK_SECRET: str = ""
    RAZORPAY_PLAN_ID_PREMIUM: str = ""  # Razorpay plan ID for premium

    # Brevo SMTP (for password reset emails)
    BREVO_SMTP_HOST: str = ""
    BREVO_SMTP_PORT: int = 587
    BREVO_SMTP_USER: str = ""   # Your Brevo account/login email
    BREVO_SMTP_KEY: str = ""    # SMTP key from Brevo dashboard → SMTP & API → SMTP
    FROM_EMAIL: str = ""
    FROM_NAME: str = "PivotHire"

    # ── Subscription / Pricing (single source of truth) ───────────────────────
    FREE_PLAN_MONTHLY_LIMIT: int = 5
    PREMIUM_PLAN_AMOUNT: int = 1999        # in smallest currency unit-friendly display (₹1999)
    PREMIUM_PLAN_AMOUNT_PAISE: int = 199900  # amount in paise for Razorpay (1999 × 100)
    PREMIUM_PLAN_CURRENCY: str = "INR"
    PREMIUM_PLAN_NAME: str = "PivotHire Premium"
    PREMIUM_PLAN_DESCRIPTION: str = "Unlimited job applications — ₹1,999/month"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Frontend URL (for Razorpay redirects & password reset links)
    FRONTEND_URL: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
