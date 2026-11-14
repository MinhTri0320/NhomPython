from sqlalchemy.orm import Session

from schemas.auth import RegisterIn, UserOut
from services import authService


def register_user(db: Session, data: RegisterIn) -> UserOut:
    user = authService.register(db, data.email, data.password, data.full_name,
                                data.role, data.company_name)
    return UserOut.from_user(user)
