// Gọi API BackEnd, lưu phiên đăng nhập và tự làm mới token khi hết hạn.
// Đổi API_URL nếu BackEnd chạy ở địa chỉ khác.
const API_URL = "http://127.0.0.1:8000";

function saveSession(data) {
  localStorage.setItem("token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
  localStorage.setItem("user", JSON.stringify(data.user));
}
function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}
function getToken() { return localStorage.getItem("token"); }
function getRefreshToken() { return localStorage.getItem("refresh_token"); }
function getUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

// Đăng xuất: thu hồi refresh token ở BackEnd rồi xóa phiên trên trình duyệt
async function logout() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await fetch(API_URL + "/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
    } catch (e) { /* mất mạng vẫn cho đăng xuất phía trình duyệt */ }
  }
  clearSession();
  window.location.href = "login.html";
}

function errorText(data, status) {
  if (data && typeof data.detail === "string") return data.detail;
  if (data && Array.isArray(data.detail)) return data.detail.map((d) => d.msg).join("; ");
  return "Lỗi " + status;
}

// Đổi refresh token lấy token mới. Nhiều yêu cầu cùng hết hạn thì chỉ gọi một lần.
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

async function api(path, options = {}, canRetry = true) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = "Bearer " + token;

  let res;
  try {
    res = await fetch(API_URL + path, { ...options, headers });
  } catch (e) {
    throw new Error("Không kết nối được BackEnd. Hãy chạy: uvicorn app:app --reload");
  }

  // Access token hết hạn: thử làm mới rồi gọi lại đúng một lần
  if (res.status === 401 && canRetry && token && !NO_REFRESH_PATHS.includes(path)) {
    if (await tryRefresh()) return api(path, options, false);
  }

  let data = null;
  try { data = await res.json(); } catch (e) { /* không có JSON */ }
  if (!res.ok) throw new Error(errorText(data, res.status));
  return data;
}

function showMessage(el, text, ok) {
  el.textContent = text;
  el.className = "msg " + (ok ? "ok" : "error");
}

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}
