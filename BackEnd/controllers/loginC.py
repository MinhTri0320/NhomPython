from sqlalchemy.orm import Session

from models.user import User
from schemas.auth import ChangePasswordIn, LoginIn, MessageOut, RefreshIn, TokenOut, UpdateProfileIn, UserOut
from services import authService, tokenService
from services.security import create_access_token


def _build_token_out(user: User, refresh_token: str) -> TokenOut:
    return TokenOut(
        access_token=create_access_token(user.id, user.role.code),
        refresh_token=refresh_token,
        user=UserOut.from_user(user),
    )


def login_user(db: Session, data: LoginIn, ip: str | None, user_agent: str | None = None) -> TokenOut:
    user = authService.authenticate(db, data.email, data.password, ip)
    refresh = tokenService.issue_refresh_token(db, user, ip, user_agent)
    return _build_token_out(user, refresh)


def refresh_session(db: Session, data: RefreshIn, ip: str | None, user_agent: str | None = None) -> TokenOut:
    user, new_refresh = tokenService.rotate_refresh_token(db, data.refresh_token, ip, user_agent)
    return _build_token_out(user, new_refresh)


def logout_user(db: Session, data: RefreshIn) -> MessageOut:
    tokenService.revoke_refresh_token(db, data.refresh_token)
    return MessageOut(message="Đã đăng xuất")


def change_password_user(db: Session, user: User, data: ChangePasswordIn) -> MessageOut:
    authService.change_password(db, user, data.old_password, data.new_password)
    return MessageOut(message="Đổi mật khẩu thành công")


def update_user_profile(db: Session, user: User, data: UpdateProfileIn) -> UserOut:
    updated = authService.update_profile(db, user, data.full_name)
    return UserOut.from_user(updated)
