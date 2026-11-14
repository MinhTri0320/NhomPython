"""Hồ sơ cá nhân của ứng viên (Story 19)."""
from sqlalchemy import BigInteger, Column, Date, DateTime, ForeignKey, String, Text, func

from config.database import Base


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), unique=True, nullable=False)
    phone = Column(String(20))
    address = Column(String(255))
    date_of_birth = Column(Date)
    gender = Column(String(10))          # MALE | FEMALE | OTHER
    avatar_url = Column(String(500))
    headline = Column(String(150))
    summary = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
