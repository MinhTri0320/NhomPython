# TRIS-13: Thiết Kế Giao Diện UI/UX & Cấu Trúc Trang

Tài liệu đặc tả kiến trúc giao diện cho dự án **Website quản lý tuyển dụng và theo dõi hồ sơ ứng tuyển**.

---

## 1. Nguyên tắc thiết kế (Design Principles)
- **Đúng trọng tâm & hiện đại**: Tập trung tối đa vào trải nghiệm tìm việc của ứng viên và quy trình đăng tuyển/lọc hồ sơ của nhà tuyển dụng.
- **Màu sắc chủ đạo**:
  - Primary Blue (`#2563eb` / `#1d4ed8`): Đại diện cho sự tin cậy, chuyên nghiệp.
  - Slate Dark (`#0f172a` / `#1e293b`): Thể hiện sự vững chắc và hiện đại.
  - Accent Colors: Green (`#10b981` - Thành công/Trúng tuyển), Yellow/Amber (`#f59e0b` - Đang duyệt/Cảnh báo), Red (`#ef4444` - Lỗi/Từ chối).
- **Đáp ứng đa thiết bị (Responsive)**: Tương thích hoàn toàn trên Desktop (>= 1200px), Tablet (768px - 1024px) và Mobile (< 768px).
- **Hệ thống Font**: System UI Fonts (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`) giúp tải trang nhanh, không phụ thuộc font ngoài.

---

## 2. Sơ đồ cây trang web (Site Map)

```
FrontEnd/
├── index.html                   (Trang chuyển hướng gốc)
├── css/
│   └── style.css                (CSS Design System toàn trang)
├── js/
│   ├── api.js                   (Gọi API BackEnd, JWT & Refresh token, Auth)
│   ├── navbar.js                (Header & điều khiển trạng thái đăng nhập)
│   ├── login.js                 (Xử lý đăng nhập & demo switcher)
│   ├── register.js              (Xử lý đăng ký & chọn vai trò)
│   ├── forgot-password.js       (Gửi yêu cầu đặt lại mật khẩu)
│   ├── reset-password.js        (Đổi mật khẩu bằng token)
│   ├── verify-email.js          (Xác thực tài khoản qua email)
│   ├── jobs.js                  (Tìm kiếm, lọc danh sách việc làm)
│   └── dashboard.js             (Bảng điều khiển phân quyền 3 vai trò)
└── html/
    ├── index.html               (Trang chủ: Hero search, danh mục, việc làm nổi bật)
    ├── jobs.html                (Trang tìm kiếm & danh sách việc làm chi tiết)
    ├── job-detail.html          (Trang chi tiết công việc & form nộp hồ sơ)
    ├── login.html               (Trang đăng nhập)
    ├── register.html            (Trang đăng ký: Ứng viên / Nhà tuyển dụng)
    ├── forgot-password.html     (Trang quên mật khẩu)
    ├── reset-password.html      (Trang đặt lại mật khẩu)
    ├── verify-email.html        (Trang thông báo kết quả xác thực email)
    └── dashboard.html           (Bảng điều khiển RBAC theo 3 vai trò)
```

---

## 3. Luồng người dùng (User Flows)

### Luồng 1: Ứng viên tìm việc & ứng tuyển
1. Vào `index.html` hoặc `jobs.html` -> Nhập từ khóa, lọc theo ngành nghề / địa điểm.
2. Bấm vào việc làm quan tâm -> Xem mô tả chi tiết tại `job-detail.html`.
3. Bấm **Ứng tuyển ngay** -> Mở modal chọn CV hoặc tải CV mới -> Nộp hồ sơ.
4. Truy cập `dashboard.html#applications` -> Theo dõi trạng thái duyệt hồ sơ theo thời gian thực (Chờ duyệt -> Phỏng vấn -> Tuyển dụng).

### Luồng 2: Nhà tuyển dụng đăng tin & duyệt hồ sơ
1. Đăng ký tài khoản chọn vai trò **Nhà tuyển dụng** kèm thông tin công ty.
2. Đăng nhập -> Vào `dashboard.html#manage-jobs` -> Bấm **Đăng tin mới**.
3. Điền các thông tin vị trí, yêu cầu, mức lương, hạn nộp hồ sơ.
4. Khi có ứng viên nộp: Vào `dashboard.html#candidate-apps` -> Xem thông tin ứng viên, tải CV và chọn cập nhật trạng thái hồ sơ.
5. Khi tin gần hết hạn: Hệ thống hiển thị thông báo/cảnh báo vàng trên Dashboard để kịp thời gia hạn.

### Luồng 3: Quản trị viên quản lý hệ thống
1. Đăng nhập bằng tài khoản Admin mặc định (`admin@example.com`).
2. Vào `dashboard.html#manage-users` -> Xem danh sách người dùng được tải từ API BackEnd `/api/admin/users`.
3. Vào `dashboard.html#moderate-jobs` -> Phê duyệt hoặc từ chối các tin tuyển dụng đang chờ duyệt.
