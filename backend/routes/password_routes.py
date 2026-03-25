import asyncio
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import hash_password
from config import get_settings
from database import get_db
from models import PasswordResetToken, User
from schemas import ForgotPasswordRequest, ResetPasswordRequest

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Password Reset"])

RESET_TOKEN_EXPIRE_MINUTES = 30


def _build_reset_email_html(reset_url: str) -> str:
    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f172a; font-size: 24px; margin: 0;">PivotHire</h1>
        </div>
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px;">
            <h2 style="color: #0f172a; font-size: 20px; margin: 0 0 12px;">Reset your password</h2>
            <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                We received a request to reset your password. Click the button below to set a new password.
                This link expires in {RESET_TOKEN_EXPIRE_MINUTES} minutes.
            </p>
            <div style="text-align: center; margin-bottom: 24px;">
                <a href="{reset_url}"
                   style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none;
                          padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                    Reset Password
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">
                If you didn't request this, you can safely ignore this email. Your password won't change.
            </p>
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
            &copy; 2026 PivotHire. All rights reserved.
        </p>
    </div>
    """


def _smtp_send(to_email: str, subject: str, html_body: str) -> None:
    """Blocking SMTP send — always called via asyncio.to_thread."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.FROM_NAME} <{settings.FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    with smtplib.SMTP(settings.BREVO_SMTP_HOST, settings.BREVO_SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(settings.BREVO_SMTP_USER, settings.BREVO_SMTP_KEY)
        server.sendmail(settings.FROM_EMAIL, to_email, msg.as_string())


async def send_reset_email(email: str, token: str) -> None:
    """Send a password reset email via Brevo SMTP.

    Falls back to console output when BREVO_SMTP_KEY is not configured
    (useful for local development without email credentials).
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    if not settings.BREVO_SMTP_KEY:
        # Dev fallback — print link so developers can test without SMTP credentials
        print(f"\n{'=' * 60}")
        print("PASSWORD RESET LINK  (Brevo SMTP not configured)")
        print(f"Email : {email}")
        print(f"Link  : {reset_url}")
        print(f"{'=' * 60}\n")
        return

    html_body = _build_reset_email_html(reset_url)

    try:
        await asyncio.to_thread(
            _smtp_send,
            to_email=email,
            subject="Reset your PivotHire password",
            html_body=html_body,
        )
    except Exception as exc:
        # Log but never surface SMTP errors to the caller —
        # the endpoint always returns success to prevent email enumeration.
        print(f"[Brevo SMTP] Failed to send reset email to {email}: {exc}")


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset email. Always returns success to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.hashed_password:
        # Only allow reset for email-based accounts (not Google OAuth-only)
        token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

        # Invalidate any existing unused tokens for this user
        existing = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False,  # noqa: E712
            )
        )
        for old_token in existing.scalars().all():
            old_token.used = True

        reset_token = PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
        )
        db.add(reset_token)
        await db.commit()

        await send_reset_email(user.email, token)

    # Always return the same message to prevent email enumeration
    return {"message": "If an account exists with that email, you will receive a password reset link."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == data.token,
            PasswordResetToken.used == False,  # noqa: E712
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if reset_token.expires_at < datetime.now(timezone.utc):
        reset_token.used = True
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    reset_token.used = True
    await db.commit()

    return {"message": "Password reset successful. You can now sign in with your new password."}