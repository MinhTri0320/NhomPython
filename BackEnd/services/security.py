"""Băm mật khẩu (bcrypt) và tạo / giải mã JWT."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from config.settings import settings
from services.errors import AppError


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except ValueError:  # hash không hợp lệ (vd: chưa thay hash mẫu)
        return False


def create_access_token(user_id: int, role_code: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload = {"sub": str(user_id), "role": role_code, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise AppError(401, "Phiên đăng nhập đã hết hạn, hãy đăng nhập lại")
    except jwt.InvalidTokenError:
        raise AppError(401, "Token không hợp lệ")
