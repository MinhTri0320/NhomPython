"""Xác thực token và phân quyền theo vai trò (RBAC - Story 18)."""
from fastapi import Depends, Header
from sqlalchemy.orm import Session

from config.database import get_db
from models.user import User
from services.errors import AppError
from services.security import decode_access_token


def get_current_user(authorization: str | None = Header(default=None),
                     db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AppError(401, "Chưa đăng nhập")
    payload = decode_access_token(authorization[7:].strip())
    user = db.get(User, int(payload["sub"]))
    if user is None or not user.is_active:
        raise AppError(401, "Tài khoản không tồn tại hoặc đã bị khóa")
    return user


def require_roles(*role_codes: str):
    """Dùng: Depends(require_roles("ADMIN")) hoặc require_roles("RECRUITER", "ADMIN")."""

    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role.code not in role_codes:
            raise AppError(403, "Bạn không có quyền thực hiện thao tác này")
        return user

    return checker
