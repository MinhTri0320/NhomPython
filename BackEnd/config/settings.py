"""Đọc cấu hình từ file .env (xem .env.example)."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", "3306"))
    DB_USER = os.getenv("DB_USER", "root")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    DB_NAME = os.getenv("DB_NAME", "recruitment")

    JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-change-me")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "120"))

    # Khóa tạm khi đăng nhập sai nhiều lần (Story 16)
    MAX_FAILED_LOGINS = 5
    LOCK_MINUTES = 15

    CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "*").split(",")]

    # Mật khẩu tài khoản admin do db/setup_db.py tạo
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com")
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@123")

    # Refresh token và các liên kết gửi qua email (Story 15, 16, 17)
    REFRESH_EXPIRE_DAYS = int(os.getenv("REFRESH_EXPIRE_DAYS", "7"))
    EMAIL_VERIFY_HOURS = int(os.getenv("EMAIL_VERIFY_HOURS", "24"))
    RESET_PASSWORD_MINUTES = int(os.getenv("RESET_PASSWORD_MINUTES", "30"))
    # true = chưa xác thực email thì không cho đăng nhập
    REQUIRE_EMAIL_VERIFIED = os.getenv("REQUIRE_EMAIL_VERIFIED", "false").lower() == "true"

    # Địa chỉ thư mục chứa các trang HTML, dùng để tạo liên kết trong email
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500/FrontEnd/html").rstrip("/")

    # Gửi email thật qua SMTP. Để trống SMTP_HOST thì nội dung email chỉ in ra cửa sổ BackEnd (dùng khi phát triển)
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM = os.getenv("MAIL_FROM", "")


settings = Settings()
