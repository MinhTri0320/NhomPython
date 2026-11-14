"""API dành riêng cho Admin (Story 18, 43)."""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from config.database import get_db
from middlewares.authMiddleware import require_roles
from models.role import ADMIN
from models.user import User
from schemas.auth import UserOut

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), _admin: User = Depends(require_roles(ADMIN))):
    """Danh sách người dùng. Chỉ Admin được gọi (các vai trò khác nhận 403)."""
    users = db.scalars(select(User).order_by(User.id)).all()
    return [UserOut.from_user(u) for u in users]
