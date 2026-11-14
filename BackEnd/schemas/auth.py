"""Dữ liệu vào / ra của các API xác thực."""
import re

from pydantic import BaseModel, field_validator

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _check_password_length(v: str) -> str:
    if len(v) < 8:
        raise ValueError("Mật khẩu tối thiểu 8 ký tự")
    if len(v.encode("utf-8")) > 72:   # giới hạn của bcrypt
        raise ValueError("Mật khẩu tối đa 72 byte")
    return v


class _EmailMixin(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not _EMAIL_RE.match(v) or len(v) > 255:
            raise ValueError("Email không hợp lệ")
        return v


class RegisterIn(_EmailMixin):
    password: str
    full_name: str
    role: str                          # CANDIDATE | RECRUITER
    company_name: str | None = None    # bắt buộc với RECRUITER

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        return _check_password_length(v)

    @field_validator("full_name")
    @classmethod
    def check_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Họ tên không được để trống")
        return v


class LoginIn(_EmailMixin):
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class VerifyEmailIn(BaseModel):
    token: str


class ForgotPasswordIn(_EmailMixin):
    pass


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, v: str) -> str:
        return _check_password_length(v)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    email_verified: bool = False

    @classmethod
    def from_user(cls, user) -> "UserOut":
        return cls(id=user.id, email=user.email, full_name=user.full_name,
                   role=user.role.code, email_verified=user.email_verified_at is not None)


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageOut(BaseModel):
    message: str
