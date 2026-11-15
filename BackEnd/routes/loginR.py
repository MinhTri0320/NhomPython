from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from config.database import get_db
from controllers import loginC
from middlewares.authMiddleware import get_current_user
from models.user import User
from schemas.auth import ChangePasswordIn, LoginIn, MessageOut, RefreshIn, TokenOut, UpdateProfileIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["Xác thực & Người dùng"])


def _client(request: Request) -> tuple[str | None, str | None]:
    ip = request.client.host if request.client else None
    return ip, request.headers.get("user-agent")


@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, request: Request, db: Session = Depends(get_db)):
    """Đăng nhập, trả về access token và refresh token."""
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


@router.put("/profile", response_model=UserOut)
def update_profile(data: UpdateProfileIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Cập nhật thông tin tài khoản đang đăng nhập."""
    return loginC.update_user_profile(db, user, data)


@router.post("/change-password", response_model=MessageOut)
def change_password(data: ChangePasswordIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Đổi mật khẩu cho người dùng đang đăng nhập."""
    return loginC.change_password_user(db, user, data)
