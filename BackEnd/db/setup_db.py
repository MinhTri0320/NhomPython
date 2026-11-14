"""Tạo CSDL từ db/schema.sql và đặt mật khẩu cho tài khoản Admin.

Chạy trong thư mục BackEnd (đã bật venv):
    python db/setup_db.py          # hỏi xác nhận nếu CSDL đã có
    python db/setup_db.py --yes    # không hỏi

CẢNH BÁO: schema.sql bắt đầu bằng DROP DATABASE nên chạy lại sẽ XÓA toàn bộ dữ liệu cũ.
"""
import argparse
import sys
from pathlib import Path

import pymysql
from pymysql.constants import CLIENT

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

from config.settings import settings  # noqa: E402
from services.security import hash_password  # noqa: E402

SCHEMA = BACKEND / "db" / "schema.sql"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--yes", action="store_true", help="không hỏi xác nhận")
    args = parser.parse_args()

    try:
        conn = pymysql.connect(host=settings.DB_HOST, port=settings.DB_PORT, user=settings.DB_USER,
                               password=settings.DB_PASSWORD, charset="utf8mb4",
                               client_flag=CLIENT.MULTI_STATEMENTS)
    except pymysql.err.OperationalError as exc:
        sys.exit(f"Không kết nối được MySQL: {exc}\n-> Bật MySQL trong XAMPP và kiểm tra file .env.")

    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name = %s",
                    (settings.DB_NAME,))
        if cur.fetchone()[0] and not args.yes:
            ans = input(f"CSDL '{settings.DB_NAME}' đã tồn tại, chạy tiếp sẽ XÓA dữ liệu cũ. Tiếp tục? (gõ yes): ")
            if ans.strip().lower() != "yes":
                sys.exit("Đã hủy, không thay đổi gì.")

        print("Đang chạy schema.sql ...")
        cur.execute(SCHEMA.read_text(encoding="utf-8"))
        while cur.nextset():
            pass
        conn.select_db(settings.DB_NAME)

        cur.execute(
            "UPDATE users SET email = %s, password_hash = %s "
            "WHERE role_id = (SELECT id FROM roles WHERE code = 'ADMIN')",
            (settings.ADMIN_EMAIL, hash_password(settings.ADMIN_PASSWORD)))
        conn.commit()
    conn.close()
    print(f"Xong. Admin: {settings.ADMIN_EMAIL} / {settings.ADMIN_PASSWORD}  (nhớ đổi mật khẩu khi dùng thật)")
    print("Chạy BackEnd: uvicorn app:app --reload")


if __name__ == "__main__":
    main()
