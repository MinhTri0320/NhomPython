# TRIS-11: Phân Tích Yêu Cầu & Thiết Kế Use Case (3 Vai Trò)

Dự án: **Website quản lý tuyển dụng và theo dõi hồ sơ ứng tuyển**  
Công nghệ: **FastAPI (BackEnd) + MySQL 8.0 (CSDL) + HTML/CSS/JS (FrontEnd)**

---

## 1. Tổng quan các tác nhân (Actors)

Hệ thống phục vụ 3 nhóm tác nhân chính cùng tác nhân Khách vãng lai (Guest):
1. **Khách (Guest)**: Người dùng chưa đăng nhập, có thể xem danh sách việc làm, tìm kiếm, đăng ký tài khoản và đăng nhập.
2. **Ứng viên (Candidate)**: Tìm kiếm việc làm, quản lý thông tin cá nhân và CV, nộp hồ sơ, theo dõi trạng thái xử lý ứng tuyển, lưu việc làm.
3. **Nhà tuyển dụng (Recruiter)**: Quản lý thông tin doanh nghiệp, đăng tin tuyển dụng, xem danh sách hồ sơ ứng tuyển, lọc và cập nhật trạng thái hồ sơ (Chờ duyệt, Phỏng vấn, Tuyển dụng, Từ chối), nhận cảnh báo tin sắp hết hạn.
4. **Quản trị viên (Admin)**: Quản lý danh mục ngành nghề, địa điểm, phê duyệt tin tuyển dụng, quản lý tài khoản người dùng, xem thống kê báo cáo toàn hệ thống.

---

## 2. Ma trận phân quyền (RBAC Matrix)

| Chức năng | Khách (Guest) | Ứng viên (Candidate) | Nhà tuyển dụng (Recruiter) | Admin |
|---|:---:|:---:|:---:|:---:|
| Xem trang chủ & danh sách việc làm | ✅ | ✅ | ✅ | ✅ |
| Tìm kiếm, lọc việc làm | ✅ | ✅ | ✅ | ✅ |
| Đăng ký (chọn vai trò) | ✅ | ❌ | ❌ | ❌ |
| Đăng nhập / Đăng xuất | ✅ | ✅ | ✅ | ✅ |
| Quên / Đặt lại mật khẩu | ✅ | ✅ | ✅ | ✅ |
| Xác thực Email qua Token | ✅ | ✅ | ✅ | ✅ |
| Quản lý hồ sơ cá nhân & CV | ❌ | ✅ | ❌ | ❌ |
| Nộp hồ sơ ứng tuyển việc làm | ❌ | ✅ | ❌ | ❌ |
| Theo dõi trạng thái ứng tuyển | ❌ | ✅ | ❌ | ❌ |
| Quản lý hồ sơ công ty | ❌ | ❌ | ✅ | ❌ |
| Đăng tin & chỉnh sửa tin tuyển dụng | ❌ | ❌ | ✅ | ❌ |
| Tiếp nhận & xử lý hồ sơ ứng viên | ❌ | ❌ | ✅ | ❌ |
| Cảnh báo tin tuyển dụng sắp hết hạn | ❌ | ❌ | ✅ | ❌ |
| Kiểm duyệt tin tuyển dụng | ❌ | ❌ | ❌ | ✅ |
| Quản lý tài khoản người dùng | ❌ | ❌ | ❌ | ✅ |
| Thống kê & báo cáo toàn sàn | ❌ | ❌ | ❌ | ✅ |

---

## 3. Đặc tả Use Case chi tiết

### Use Case 1: Đăng ký & Kích hoạt tài khoản (TRIS-15)
- **Tác nhân**: Khách
- **Luồng chính**:
  1. Người dùng truy cập `register.html`.
  2. Chọn vai trò: **Ứng viên** hoặc **Nhà tuyển dụng**.
  3. Điền thông tin: Họ tên, Email, Mật khẩu (tối thiểu 8 ký tự). Nếu là Nhà tuyển dụng, bổ sung Tên công ty.
  4. Hệ thống kiểm tra trùng lặp email và lưu user với mật khẩu mã hóa BCrypt/Argon2.
  5. Hệ thống sinh mã token ngẫu nhiên, lưu vào bảng `email_verification_tokens` và gửi email kích hoạt (hoặc hiển thị log console).
  6. Người dùng click vào link kích hoạt `verify-email.html?token=...`, hệ thống cập nhật `email_verified_at`.

### Use Case 2: Đăng nhập & Xác thực phiên làm việc (TRIS-19)
- **Tác nhân**: Ứng viên, Nhà tuyển dụng, Admin
- **Luồng chính**:
  1. Người dùng nhập Email và Mật khẩu tại `login.html`.
  2. BackEnd xác thực thông tin tài khoản và kiểm tra `is_active`.
  3. Khi đăng nhập thành công, máy chủ sinh cặp token:
     - `access_token` (JWT, thời hạn ngắn, ví dụ: 60 phút)
     - `refresh_token` (Lưu băm SHA-256 vào bảng `refresh_tokens`, thời hạn 7 - 30 ngày)
  4. FrontEnd lưu session vào `localStorage` và chuyển hướng vào `dashboard.html`.
  5. Giao diện `dashboard.html` đọc quyền (`role`) để hiển thị đúng menu và tính năng.

### Use Case 3: Quên & Đặt lại mật khẩu (TRIS-23)
- **Tác nhân**: Mọi người dùng đã có tài khoản
- **Luồng chính**:
  1. Người dùng nhập email tại `forgot-password.html`.
  2. Hệ thống kiểm tra email tồn tại và tạo token một lần trong `password_reset_tokens`.
  3. Gửi liên kết `reset-password.html?token=...`.
  4. Người dùng nhập mật khẩu mới và xác nhận mật khẩu.
  5. Hệ thống cập nhật `password_hash`, đánh dấu token đã dùng và thu hồi các refresh token cũ.
