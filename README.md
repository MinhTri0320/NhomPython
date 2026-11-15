# Hệ thống quản lý tuyển dụng & theo dõi hồ sơ ứng tuyển

Ba vai trò: **Ứng viên**, **Nhà tuyển dụng**, **Admin**. BackEnd FastAPI + MySQL, FrontEnd HTML/CSS/JS thuần.

## Cấu trúc

```
.vscode/            cấu hình VS Code
.github/workflows/  CI (GitHub Actions)
docs/               tài liệu: phân tích yêu cầu, ERD, giao diện
BackEnd/
  config/           cấu hình, kết nối CSDL
  controllers/      xử lý yêu cầu (đuôi C)
  middlewares/      xác thực token, phân quyền theo vai trò
  models/           bảng CSDL (SQLAlchemy)
  routes/           khai báo API (đuôi R)
  schemas/          dữ liệu vào / ra
  services/         nghiệp vụ (đăng nhập, token, gửi email)
  db/               schema.sql + setup_db.py
  tests/            unit test
  app.py            file chạy chính
FrontEnd/
  html/ css/ js/ assets/img/
```

## Tiến độ theo Sprint (Jira)

| Sprint | Nội dung | Trạng thái |
|---|---|---|
| 1 | Khởi tạo, CSDL, CI, đăng ký, xác thực email, đăng nhập, refresh token, đăng xuất, đổi mật khẩu, quên và đặt lại mật khẩu, phân quyền RBAC | Hoàn thành 100% |
| 2 | Hồ sơ ứng viên, CV, hồ sơ công ty, đăng và duyệt tin tuyển dụng | Sprint tiếp theo (đã có CSDL & UI) |
| 3 | Tìm kiếm, lọc việc làm, ứng tuyển, theo dõi và xử lý hồ sơ | Sprint tiếp theo (đã có CSDL & UI) |
| 4 | Thông báo, cảnh báo, thống kê, quản trị Admin | Sprint tiếp theo (đã có CSDL & UI) |
| 5 | Kiểm thử, UAT, triển khai | Chưa làm |

## Cài đặt (mỗi thành viên làm trên máy mình)

Cần: Python 3.10+, XAMPP (hoặc MySQL 8) đã **Start MySQL**.

```bash
git clone https://github.com/MinhTri0320/NhomPython.git
cd NhomPython/BackEnd

python -m venv venv
venv\Scripts\activate                 # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt

copy .env.example .env                # macOS/Linux: cp .env.example .env
python db/setup_db.py                 # tạo CSDL (XÓA dữ liệu cũ nếu đã có)
python test.py                        # kiểm tra kết nối
python -m unittest discover -s tests -t . -v   # chạy unit test

uvicorn app:app --reload              # API: http://127.0.0.1:8000  (tài liệu: /docs)
```

Mở thư mục `NhomPython` bằng VS Code, cài extension **Live Server**, bấm chuột phải `FrontEnd/html/login.html` → *Open with Live Server*.
Admin mặc định: `admin@example.com` / `Admin@123` (đổi trong `.env` trước khi chạy `setup_db.py`).

## API Sprint 1

| Method | Đường dẫn | Mô tả | Quyền |
|---|---|---|---|
| POST | `/api/auth/register` | Đăng ký (CANDIDATE hoặc RECRUITER), gửi email xác thực | Công khai |
| POST | `/api/auth/verify-email` | Xác thực email bằng token | Công khai |
| POST | `/api/auth/resend-verification` | Gửi lại email xác thực | Đã đăng nhập |
| POST | `/api/auth/login` | Đăng nhập, nhận access và refresh token | Công khai |
| POST | `/api/auth/refresh` | Đổi refresh token lấy token mới | Công khai |
| POST | `/api/auth/logout` | Đăng xuất (thu hồi refresh token) | Công khai |
| GET | `/api/auth/me` | Thông tin người đang đăng nhập | Đã đăng nhập |
| PUT | `/api/auth/profile` | Cập nhật thông tin tài khoản | Đã đăng nhập |
| POST | `/api/auth/change-password` | Đổi mật khẩu cho tài khoản đang đăng nhập | Đã đăng nhập |
| POST | `/api/auth/forgot-password` | Gửi liên kết đặt lại mật khẩu | Công khai |
| POST | `/api/auth/reset-password` | Đặt mật khẩu mới bằng token | Công khai |
| GET | `/api/admin/users` | Danh sách người dùng hệ thống | Admin |
| PATCH | `/api/admin/users/{id}/status` | Khóa hoặc mở khóa tài khoản người dùng | Admin |
| GET | `/api/admin/stats` | Thống kê số lượng người dùng theo vai trò | Admin |

## Email khi phát triển

Chưa điền `SMTP_HOST` trong `.env` thì hệ thống **không gửi email thật**, mà in nội dung email (kèm liên kết xác thực / đặt lại mật khẩu) ra cửa sổ đang chạy `uvicorn`. Bạn sao chép liên kết đó dán vào trình duyệt. Muốn gửi thật, điền SMTP (ví dụ Gmail cần "mật khẩu ứng dụng").
Liên kết trong email dùng `FRONTEND_URL` (mặc định `http://127.0.0.1:5500/FrontEnd/html`, đúng với Live Server).

## Làm việc nhóm

- Dữ liệu CSDL không nằm trong Git, chỉ có `db/schema.sql`. Ai đổi schema thì báo nhóm, mọi người chạy lại `python db/setup_db.py`.
- Không commit `.env` và thư mục `venv/`.
- Mỗi người làm trên nhánh riêng: `git checkout -b feature/ten-chuc-nang`, rồi tạo Pull Request. CI sẽ tự kiểm tra code và chạy `schema.sql` trên MySQL 8.
