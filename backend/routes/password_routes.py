import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models import User, PasswordResetToken
from schemas import ForgotPasswordRequest, ResetPasswordRequest
from auth import hash_password
from config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/auth", tags=["Password Reset"])

RESET_TOKEN_EXPIRE_MINUTES = 30


async def send_reset_email(email: str, token: str):
    """Send password reset email via SendGrid."""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    if not settings.SENDGRID_API_KEY:
        # Fallback: print to console for development
        print(f"\n{'='*60}")
        print(f"PASSWORD RESET LINK (SendGrid not configured)")
        print(f"Email: {email}")
        print(f"Link:  {reset_url}")
        print(f"{'='*60}\n")
        return

    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content

    sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)

    html_content = f"""
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

    message = Mail(
        from_email=Email(settings.SENDGRID_FROM_EMAIL, "PivotHire"),
        to_emails=To(email),
        subject="Reset your PivotHire password",
        html_content=Content("text/html", html_content),
    )

    try:
        sg.send(message)
    except Exception as e:
        print(f"SendGrid error: {e}")
        # Don't expose email errors to user — still return success


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Send a password reset email. Always returns success to prevent email enumeration."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if user and user.hashed_password:
        # Only allow reset for email-based accounts (not Google OAuth-only)
        token = secrets.token_urlsafe(48)
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

        # Invalidate any existing tokens for this user
        existing = await db.execute(
            select(PasswordResetToken).where(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.used == False,
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

    # Always return success to prevent email enumeration
    return {"message": "If an account exists with that email, you will receive a password reset link."}


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """Reset password using a valid reset token."""
    result = await db.execute(
        select(PasswordResetToken).where(
            PasswordResetToken.token == data.token,
            PasswordResetToken.used == False,
        )
    )
    reset_token = result.scalar_one_or_none()

    if not reset_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if reset_token.expires_at < datetime.now(timezone.utc):
        reset_token.used = True
        await db.commit()
        raise HTTPException(status_code=400, detail="Reset token has expired")

    # Update password
    user_result = await db.execute(select(User).where(User.id == reset_token.user_id))
    user = user_result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    user.hashed_password = hash_password(data.new_password)
    reset_token.used = True
    await db.commit()

    return {"message": "Password reset successful. You can now sign in with your new password."}
