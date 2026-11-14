"""Import hết model để SQLAlchemy biết các bảng và quan hệ giữa chúng."""
from models.candidateProfile import CandidateProfile  # noqa: F401
from models.company import Company  # noqa: F401
from models.loginAttempt import LoginAttempt  # noqa: F401
from models.role import Role  # noqa: F401
from models.token import EmailVerificationToken, PasswordResetToken, RefreshToken  # noqa: F401
from models.user import User  # noqa: F401
