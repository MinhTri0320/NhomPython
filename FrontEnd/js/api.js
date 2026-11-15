// ==========================================================================
// API CLIENT & AUTHENTICATION MANAGER (Sprint 1 - FrontEnd)
// ==========================================================================

const API_URL = "http://127.0.0.1:8000";

// Tên hiển thị các vai trò trong hệ thống
const ROLE_NAMES = {
  CANDIDATE: "Ứng viên",
  RECRUITER: "Nhà tuyển dụng",
  ADMIN: "Quản trị viên"
};

// Trạng thái ứng tuyển
const APP_STATUS_NAMES = {
  PENDING: { label: "Chờ duyệt", badge: "badge-warning" },
  REVIEWING: { label: "Đang xem xét", badge: "badge-primary" },
  INTERVIEW: { label: "Phỏng vấn", badge: "badge-primary" },
  OFFERED: { label: "Trúng tuyển", badge: "badge-success" },
  REJECTED: { label: "Từ chối", badge: "badge-danger" }
};

// Quản lý phiên làm việc trong LocalStorage
function saveSession(data) {
  if (data.access_token) localStorage.setItem("token", data.access_token);
  if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function getToken() {
  return localStorage.getItem("token");
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch {
    return null;
  }
}

function isLoggedIn() {
  return !!getToken();
}

function hasRole(role) {
  const u = getUser();
  return u && u.role === role;
}

// Kiểm tra quyền truy cập trang
function requireAuth(allowedRoles = []) {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = "login.html";
    return false;
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    alert("Bạn không có quyền truy cập trang này!");
    window.location.href = "dashboard.html";
    return false;
  }
  return true;
}

// Đăng xuất: gửi yêu cầu thu hồi refresh token tới BackEnd và xóa storage
async function logout() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await fetch(API_URL + "/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
    } catch (e) {
      // Dù mất kết nối BackEnd vẫn xóa phiên ở client
    }
  }
  clearSession();
  window.location.href = "login.html";
}

function errorText(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join("; ");
  return "Lỗi máy chủ (" + status + ")";
}

// Tự động làm mới access token khi hết hạn (HTTP 401)
let refreshing = null;
function tryRefresh() {
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(false);
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(API_URL + "/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: rt }),
        });
        if (!res.ok) return false;
        saveSession(await res.json());
        return true;
      } catch (e) {
        return false;
      } finally {
        refreshing = null;
      }
    })();
  }
  return refreshing;
}

const NO_REFRESH_PATHS = ["/api/auth/login", "/api/auth/refresh"];

// Hàm gọi API trung tâm
async function api(path, options = {}, canRetry = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(API_URL + path, { ...options, headers });
  } catch (e) {
    throw new Error("Không kết nối được BackEnd (FastAPI: http://127.0.0.1:8000). Hãy đảm bảo server đang chạy!");
  }

  // Access token hết hạn -> thử làm mới bằng refresh token rồi thử lại
  if (res.status === 401 && canRetry && token && !NO_REFRESH_PATHS.includes(path)) {
    if (await tryRefresh()) {
      return api(path, options, false);
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // Không có phản hồi JSON
  }

  if (!res.ok) {
    throw new Error(errorText(data, res.status));
  }
  return data;
}

// Tiện ích hiển thị thông báo
function showMessage(el, text, ok = true) {
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "error");
  el.style.display = "flex";
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Định dạng tiền tệ VND (ví dụ: 15,000,000 VNĐ)
function formatCurrency(num) {
  if (!num) return "Thỏa thuận";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}

// Định dạng ngày hiển thị (DD/MM/YYYY)
function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return dateStr;
  }
}
