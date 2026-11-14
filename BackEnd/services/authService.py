"""Nghiệp vụ đăng ký / đăng nhập (Story 15, 16)."""
import logging
from datetime import datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from config.settings import settings
from models.candidateProfile import CandidateProfile
from models.company import Company
from models.loginAttempt import LoginAttempt
from models.role import ADMIN, CANDIDATE, RECRUITER, Role
from models.user import User
from services import tokenService
from services.errors import AppError
from services.security import hash_password, verify_password

SELF_REGISTER_ROLES = (CANDIDATE, RECRUITER)   # Admin không tự đăng ký được


def register(db: Session, email: str, password: str, full_name: str,
             role_code: str, company_name: str | None) -> User:
    if role_code not in SELF_REGISTER_ROLES:
        raise AppError(400, "Vai trò phải là CANDIDATE hoặc RECRUITER")
    if role_code == RECRUITER and not company_name:
        raise AppError(400, "Nhà tuyển dụng cần nhập tên công ty")
    if db.scalar(select(User).where(User.email == email)):
        raise AppError(409, "Email đã được sử dụng")

    role = db.scalar(select(Role).where(Role.code == role_code))
    if role is None:
        raise AppError(500, "Chưa có dữ liệu vai trò, hãy chạy db/setup_db.py")

    user = User(role_id=role.id, email=email, password_hash=hash_password(password),
                full_name=full_name, is_active=True)
    try:
        db.add(user)
        db.flush()   # lấy user.id
        if role_code == CANDIDATE:
            db.add(CandidateProfile(user_id=user.id))
        else:
            db.add(Company(owner_id=user.id, name=company_name))
        db.commit()
    except IntegrityError:
        db.rollback()
        raise AppError(409, "Email đã được sử dụng")
    db.refresh(user)
    try:   # gửi email xác thực (Story 15); lỗi gửi mail không làm hỏng việc đăng ký
        tokenService.send_verification_email(db, user)
    except Exception:  # noqa: BLE001
        db.rollback()
        logging.getLogger("uvicorn.error").exception("Không gửi được email xác thực cho %s", email)
    return user


def _record_attempt(db: Session, email: str, user_id: int | None, ip: str | None, ok: bool):
    db.add(LoginAttempt(email=email, user_id=user_id, ip_address=ip, is_success=ok))
    db.commit()


def authenticate(db: Session, email: str, password: str, ip: str | None) -> User:
    since = datetime.now() - timedelta(minutes=settings.LOCK_MINUTES)
    failed = db.scalar(
        select(func.count()).select_from(LoginAttempt).where(
            LoginAttempt.email == email,
            LoginAttempt.is_success.is_(False),
            LoginAttempt.created_at >= since,
        )
    )
    if failed >= settings.MAX_FAILED_LOGINS:
        raise AppError(429, f"Sai mật khẩu quá {settings.MAX_FAILED_LOGINS} lần, "
                            f"thử lại sau {settings.LOCK_MINUTES} phút")

    user = db.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.password_hash):
        _record_attempt(db, email, user.id if user else None, ip, False)
        raise AppError(401, "Email hoặc mật khẩu không đúng")
    if not user.is_active:
        raise AppError(403, "Tài khoản đã bị khóa")
    if settings.REQUIRE_EMAIL_VERIFIED and user.email_verified_at is None:
        raise AppError(403, "Hãy xác thực email trước khi đăng nhập (kiểm tra hộp thư của bạn)")

    user.last_login_at = datetime.now()
    db.add(LoginAttempt(email=email, user_id=user.id, ip_address=ip, is_success=True))
    db.commit()
    return user


def is_admin(user: User) -> bool:
    return user.role.code == ADMIN
