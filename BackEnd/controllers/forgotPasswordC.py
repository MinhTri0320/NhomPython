"""Quên và đặt lại mật khẩu (Story 17)."""
from sqlalchemy.orm import Session

from schemas.auth import ForgotPasswordIn, MessageOut, ResetPasswordIn
from services import tokenService


def forgot_password(db: Session, data: ForgotPasswordIn) -> MessageOut:
    tokenService.request_password_reset(db, data.email)
    # Luôn trả cùng một thông báo dù email có tồn tại hay không
    return MessageOut(message="Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu")


def reset_password(db: Session, data: ResetPasswordIn) -> MessageOut:
    tokenService.reset_password(db, data.token, data.new_password)
    return MessageOut(message="Đặt lại mật khẩu thành công, hãy đăng nhập bằng mật khẩu mới")
