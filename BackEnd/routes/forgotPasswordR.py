from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from controllers import forgotPasswordC
from schemas.auth import ForgotPasswordIn, MessageOut, ResetPasswordIn

router = APIRouter(prefix="/api/auth", tags=["Quên mật khẩu"])


@router.post("/forgot-password", response_model=MessageOut)
def forgot_password(data: ForgotPasswordIn, db: Session = Depends(get_db)):
    return forgotPasswordC.forgot_password(db, data)


@router.post("/reset-password", response_model=MessageOut)
def reset_password(data: ResetPasswordIn, db: Session = Depends(get_db)):
    return forgotPasswordC.reset_password(db, data)
