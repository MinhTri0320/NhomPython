from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from config.database import get_db
from controllers import loginC
from middlewares.authMiddleware import get_current_user
from models.user import User
from schemas.auth import LoginIn, MessageOut, RefreshIn, TokenOut, UserOut

router = APIRouter(prefix="/api/auth", tags=["Đăng nhập"])


def _client(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    return ip, request.headers.get("user-agent")


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    ip, ua = _client(request)
    return loginC.login_user(db, data, ip, ua)


@router.post("/refresh", response_model=TokenOut)
def refresh(data: RefreshIn, request: Request, db: Session = Depends(get_db)):
    """Đổi refresh token lấy access token mới (và refresh token mới)."""
    ip, ua = _client(request)
    return loginC.refresh_session(db, data, ip, ua)


@router.post("/logout", response_model=MessageOut)
def logout(data: RefreshIn, db: Session = Depends(get_db)):
    """Đăng xuất: thu hồi refresh token."""
    return loginC.logout_user(db, data)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    """Thông tin người đang đăng nhập (cần header Authorization: Bearer <token>)."""
    return UserOut.from_user(user)
