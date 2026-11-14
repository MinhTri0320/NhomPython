"""Vai trò người dùng (Story 18)."""
from sqlalchemy import Column, Integer, String

from config.database import Base

CANDIDATE = "CANDIDATE"   # Ứng viên
RECRUITER = "RECRUITER"   # Nhà tuyển dụng
ADMIN = "ADMIN"           # Quản trị viên


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    code = Column(String(20), unique=True, nullable=False)
    name = Column(String(50), nullable=False)
    description = Column(String(255))
