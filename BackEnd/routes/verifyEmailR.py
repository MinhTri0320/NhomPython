from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from controllers import verifyEmailC
from middlewares.authMiddleware import get_current_user
from models.user import User
from schemas.auth import MessageOut, VerifyEmailIn

router = APIRouter(prefix="/api/auth", tags=["Xác thực email"])


@router.post("/verify-email", response_model=MessageOut)
def verify_email(data: VerifyEmailIn, db: Session = Depends(get_db)):
    return verifyEmailC.verify_email(db, data)


@router.post("/resend-verification", response_model=MessageOut)
def resend_verification(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Gửi lại email xác thực cho người đang đăng nhập."""
    return verifyEmailC.resend_verification(db, user)
