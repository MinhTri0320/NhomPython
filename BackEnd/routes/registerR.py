from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from config.database import get_db
from controllers import registerC
from schemas.auth import RegisterIn, UserOut

router = APIRouter(prefix="/api/auth", tags=["Đăng ký"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    return registerC.register_user(db, data)
