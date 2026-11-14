"""Hồ sơ công ty của nhà tuyển dụng (Story 22)."""
from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text, func

from config.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(BigInteger, primary_key=True)
    owner_id = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(200), nullable=False)
    logo_url = Column(String(500))
    description = Column(Text)
    address = Column(String(255))
    website = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
