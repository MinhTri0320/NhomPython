"""API dành riêng cho Admin (Story 18, 41, 43 - RBAC)."""
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from config.database import get_db
from middlewares.authMiddleware import require_roles
from models.role import ADMIN, CANDIDATE, RECRUITER, Role
from models.user import User
from schemas.auth import AdminStatsOut, UserOut
from services.errors import AppError

router = APIRouter(prefix="/api/admin", tags=["Quản trị viên (Admin)"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_roles(ADMIN))):
    """Danh sách người dùng. Chỉ Admin được gọi (các vai trò khác nhận 403)."""
    users = db.scalars(select(User).order_by(User.id)).all()
    return [UserOut.from_user(u) for u in users]


@router.patch("/users/{user_id}/status", response_model=UserOut)
def toggle_user_status(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_roles(ADMIN))):
    """Khóa hoặc mở khóa tài khoản người dùng (Story 43)."""
    if user_id == admin.id:
        raise AppError(400, "Không thể tự khóa tài khoản Admin của chính mình")
    user = db.get(User, user_id)
    if not user:
        raise AppError(404, "Không tìm thấy người dùng")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)
    return UserOut.from_user(user)


@router.get("/stats", response_model=AdminStatsOut)
def get_admin_stats(db: Session = Depends(get_db), _admin: User = Depends(require_roles(ADMIN))):
    """Thống kê tổng quan người dùng theo vai trò phục vụ Admin Dashboard (Story 41)."""
    total_users = db.scalar(select(func.count(User.id))) or 0
    total_candidates = db.scalar(
        select(func.count(User.id)).join(Role).where(Role.code == CANDIDATE)
    ) or 0
    total_recruiters = db.scalar(
        select(func.count(User.id)).join(Role).where(Role.code == RECRUITER)
    ) or 0
    total_admins = db.scalar(
        select(func.count(User.id)).join(Role).where(Role.code == ADMIN)
    ) or 0
    verified_users = db.scalar(
        select(func.count(User.id)).where(User.email_verified_at.is_not(None))
    ) or 0
    active_users = db.scalar(
        select(func.count(User.id)).where(User.is_active.is_(True))
    ) or 0

    return AdminStatsOut(
        total_users=total_users,
        total_candidates=total_candidates,
        total_recruiters=total_recruiters,
        total_admins=total_admins,
        verified_users=verified_users,
        active_users=active_users,
    )
