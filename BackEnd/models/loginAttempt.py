"""Nhật ký đăng nhập, dùng để khóa tạm khi sai nhiều lần (Story 16)."""
from sqlalchemy import BigInteger, Boolean, Column, DateTime, ForeignKey, String, func

from config.database import Base


class LoginAttempt(Base):
    __tablename__ = "login_attempts"

    id = Column(BigInteger, primary_key=True)
    email = Column(String(255), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    ip_address = Column(String(45))
    is_success = Column(Boolean, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
