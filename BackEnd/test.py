"""Kiểm tra nhanh BackEnd kết nối được CSDL (chạy: python test.py)."""
from sqlalchemy import text

from config.database import engine

with engine.connect() as conn:
    roles = [row[0] for row in conn.execute(text("SELECT code FROM roles ORDER BY id"))]
    tables = conn.execute(text(
        "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()")).scalar()
print("Kết nối CSDL thành công.")
print("Số bảng/view:", tables)
print("Vai trò:", roles)
