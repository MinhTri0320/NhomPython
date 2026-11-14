"""Token dùng một lần và refresh token (Story 15, 16, 17).

Quy ước bảo mật: token thật (chuỗi ngẫu nhiên) chỉ gửi cho người dùng, trong CSDL
chỉ lưu mã băm SHA-256 của nó. Nhờ vậy lộ CSDL cũng không dùng được token.
"""
import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import delete, func, select, update
from sqlalchemy.orm import Session

from config.settings import settings
from models.loginAttempt import LoginAttempt
from models.token import EmailVerificationToken, PasswordResetToken, RefreshToken
from models.user import User
from services import emailService
from services.errors import AppError
from services.security import hash_password


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()   # 64 ký tự hex


def new_token() -> str:
    return secrets.token_urlsafe(32)


# ---------------------------------------------------------------- Xác thực email (Story 15)

def send_verification_email(db: Session, user: User) -> None:
    now = datetime.now()
    # Thu hồi các liên kết cũ chưa dùng, chỉ liên kết mới nhất có hiệu lực
    db.execute(update(EmailVerificationToken)
               .where(EmailVerificationToken.user_id == user.id,
                      EmailVerificationToken.used_at.is_(None))
               .values(used_at=now))
    raw = new_token()
    db.add(EmailVerificationToken(
        user_id=user.id, token_hash=hash_token(raw),
        expires_at=now + timedelta(hours=settings.EMAIL_VERIFY_HOURS)))
    db.commit()

    link = f"{settings.FRONTEND_URL}/verify-email.html?token={raw}"
    emailService.send_mail(
        user.email, "Xác thực email tài khoản",
        f"Xin chào {user.full_name},\n\n"
        f"Bấm vào liên kết sau để xác thực email (có hiệu lực {settings.EMAIL_VERIFY_HOURS} giờ):\n{link}\n\n"
        "Nếu bạn không đăng ký tài khoản, hãy bỏ qua email này.")


def resend_verification_email(db: Session, user: User) -> None:
    """Gửi lại email xác thực, tối đa 1 lần mỗi phút để tránh spam."""
    recent = db.scalar(
        select(func.count()).select_from(EmailVerificationToken).where(
            EmailVerificationToken.user_id == user.id,
            EmailVerificationToken.created_at >= datetime.now() - timedelta(minutes=1)))
    if recent:
        raise AppError(429, "Vui lòng đợi 1 phút rồi gửi lại")
    send_verification_email(db, user)


def verify_email(db: Session, raw_token: str) -> User:
    row = db.scalar(select(EmailVerificationToken)
                    .where(EmailVerificationToken.token_hash == hash_token(raw_token)))
    now = datetime.now()
    if row is None or row.expires_at < now:
        raise AppError(400, "Liên kết xác thực không hợp lệ hoặc đã hết hạn")
    user = db.get(User, row.user_id)
    if user is None:
        raise AppError(400, "Liên kết xác thực không hợp lệ hoặc đã hết hạn")
    if user.email_verified_at is not None:      # bấm lần thứ hai: coi như thành công
        return user
    if row.used_at is not None:
        raise AppError(400, "Liên kết xác thực không hợp lệ hoặc đã hết hạn")
    row.used_at = now
    user.email_verified_at = now
    db.commit()
    return user


# ---------------------------------------------------------------- Quên mật khẩu (Story 17)

MAX_RESET_REQUESTS_PER_HOUR = 3


def request_password_reset(db: Session, email: str) -> None:
    """Luôn kết thúc êm, không cho biết email có tồn tại hay không (tránh dò tài khoản)."""
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not user.is_active:
        return
    now = datetime.now()
    recent = db.scalar(
        select(func.count()).select_from(PasswordResetToken).where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.created_at >= now - timedelta(hours=1)))
    if recent >= MAX_RESET_REQUESTS_PER_HOUR:
        return
    db.execute(update(PasswordResetToken)
               .where(PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None))
               .values(used_at=now))
    raw = new_token()
    db.add(PasswordResetToken(
        user_id=user.id, token_hash=hash_token(raw),
        expires_at=now + timedelta(minutes=settings.RESET_PASSWORD_MINUTES)))
    db.commit()

    link = f"{settings.FRONTEND_URL}/reset-password.html?token={raw}"
    emailService.send_mail(
        user.email, "Đặt lại mật khẩu",
        f"Xin chào {user.full_name},\n\n"
        f"Bấm vào liên kết sau để đặt lại mật khẩu (có hiệu lực {settings.RESET_PASSWORD_MINUTES} phút, dùng một lần):\n"
        f"{link}\n\nNếu bạn không yêu cầu, hãy bỏ qua email này, mật khẩu của bạn không thay đổi.")


def reset_password(db: Session, raw_token: str, new_password: str) -> None:
    row = db.scalar(select(PasswordResetToken)
                    .where(PasswordResetToken.token_hash == hash_token(raw_token)))
    now = datetime.now()
    if row is None or row.used_at is not None or row.expires_at < now:
        raise AppError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise AppError(400, "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn")

    user.password_hash = hash_password(new_password)
    row.used_at = now
    # Đổi mật khẩu thì mọi phiên đăng nhập cũ phải hết hiệu lực
    db.execute(update(RefreshToken)
               .where(RefreshToken.user_id == user.id, RefreshToken.revoked_at.is_(None))
               .values(revoked_at=now))
    # Gỡ khóa tạm do đăng nhập sai (nếu có) để người dùng đăng nhập lại ngay
    db.execute(delete(LoginAttempt)
               .where(LoginAttempt.email == user.email, LoginAttempt.is_success.is_(False)))
    db.commit()


# ---------------------------------------------------------------- Refresh token (Story 16)

def issue_refresh_token(db: Session, user: User, ip: str | None, user_agent: str | None) -> str:
    raw = new_token()
    db.add(RefreshToken(
        user_id=user.id, token_hash=hash_token(raw),
        user_agent=(user_agent or "")[:255] or None, ip_address=ip,
        expires_at=datetime.now() + timedelta(days=settings.REFRESH_EXPIRE_DAYS)))
    db.commit()
    return raw


def rotate_refresh_token(db: Session, raw_token: str, ip: str | None,
                         user_agent: str | None) -> tuple[User, str]:
    """Đổi refresh token cũ lấy cái mới (mỗi token chỉ dùng được một lần)."""
    expired = AppError(401, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại")
    row = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_token(raw_token)))
    if row is None or row.revoked_at is not None or row.expires_at < datetime.now():
        raise expired
    user = db.get(User, row.user_id)
    if user is None or not user.is_active:
        raise expired
    row.revoked_at = datetime.now()
    return user, issue_refresh_token(db, user, ip, user_agent)   # commit cả hai thay đổi


def revoke_refresh_token(db: Session, raw_token: str) -> None:
    db.execute(update(RefreshToken)
               .where(RefreshToken.token_hash == hash_token(raw_token),
                      RefreshToken.revoked_at.is_(None))
               .values(revoked_at=datetime.now()))
    db.commit()
