const ROLE_NAMES = { CANDIDATE: "Ứng viên", RECRUITER: "Nhà tuyển dụng", ADMIN: "Quản trị viên" };
const ROLE_INTRO = {
  CANDIDATE: "Bạn có thể quản lý hồ sơ, tìm việc làm và theo dõi trạng thái ứng tuyển.",
  RECRUITER: "Bạn có thể đăng tin tuyển dụng và xử lý hồ sơ ứng tuyển.",
  ADMIN: "Bạn có thể quản lý người dùng, duyệt tin và xem thống kê toàn hệ thống.",
};

async function init() {
  if (!getToken()) { window.location.href = "login.html"; return; }
  let user;
  try {
    user = await api("/api/auth/me");
  } catch (err) {
    clearSession();                      // token và refresh token đều không dùng được
    window.location.href = "login.html";
    return;
  }
  document.getElementById("userName").textContent = user.full_name;
  document.getElementById("userEmail").textContent = user.email;
  document.getElementById("userRole").textContent = ROLE_NAMES[user.role] || user.role;
  document.getElementById("intro").textContent = ROLE_INTRO[user.role] || "";
  if (!user.email_verified) document.getElementById("verifyBox").classList.remove("hidden");
  if (user.role === "ADMIN") {
    try { await loadUsers(); } catch (err) { /* không chặn trang nếu lỗi tải danh sách */ }
  }
}

async function loadUsers() {
  const users = await api("/api/admin/users");
  const tbody = document.querySelector("#userTable tbody");
  tbody.innerHTML = "";
  for (const u of users) {
    const tr = document.createElement("tr");
    const cells = [u.id, u.full_name, u.email, ROLE_NAMES[u.role] || u.role,
                   u.email_verified ? "Đã xác thực" : "Chưa"];
    for (const text of cells) {
      const td = document.createElement("td");
      td.textContent = text;             // textContent: tránh chèn HTML từ dữ liệu người dùng
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  document.getElementById("adminBox").classList.remove("hidden");
}

document.getElementById("resendBtn").addEventListener("click", async () => {
  const box = document.getElementById("verifyMsg");
  try {
    const data = await api("/api/auth/resend-verification", { method: "POST" });
    showMessage(box, data.message, true);
  } catch (err) {
    showMessage(box, err.message, false);
  }
});

document.getElementById("logoutBtn").addEventListener("click", logout);
init();
