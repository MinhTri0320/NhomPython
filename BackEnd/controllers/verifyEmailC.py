"""Xác thực email (Story 15)."""
from sqlalchemy.orm import Session

from models.user import User
from schemas.auth import MessageOut, VerifyEmailIn
from services import tokenService


def verify_email(db: Session, data: VerifyEmailIn) -> MessageOut:
    tokenService.verify_email(db, data.token)
    return MessageOut(message="Xác thực email thành công")


def resend_verification(db: Session, user: User) -> MessageOut:
    if user.email_verified_at is not None:
        return MessageOut(message="Email của bạn đã được xác thực")
    tokenService.resend_verification_email(db, user)
    return MessageOut(message="Đã gửi lại email xác thực, hãy kiểm tra hộp thư")
