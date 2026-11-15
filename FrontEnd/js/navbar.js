// ==========================================================================
// COMMON NAVBAR HANDLER FOR PUBLIC PAGES
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  renderNavbarAuth();
  setupDropdowns();
});

function renderNavbarAuth() {
  const authContainer = document.getElementById("navAuthActions");
  if (!authContainer) return;

  const user = getUser();
  const token = getToken();

  if (token && user) {
    const roleBadgeClass = user.role === "ADMIN" ? "badge-danger" : (user.role === "RECRUITER" ? "badge-warning" : "badge-primary");
    const roleName = ROLE_NAMES[user.role] || user.role;
    const initial = (user.full_name || "U").charAt(0).toUpperCase();

    authContainer.innerHTML = `
      <div class="user-menu" id="userMenuToggle">
        <div class="user-avatar">${initial}</div>
        <div style="line-height: 1.2;">
          <div style="font-weight: 600; font-size: 0.9rem;">${escapeHtml(user.full_name)}</div>
          <span class="badge ${roleBadgeClass}" style="font-size: 0.7rem;">${roleName}</span>
        </div>
        <i class="fa-solid fa-chevron-down" style="font-size: 0.75rem; color: var(--text-light); margin-left: 4px;"></i>

        <div class="user-dropdown" id="userDropdown">
          <div class="user-dropdown-header">
            <div class="user-dropdown-name">${escapeHtml(user.full_name)}</div>
            <div class="user-dropdown-email">${escapeHtml(user.email)}</div>
          </div>
          <a href="dashboard.html">
            <i class="fa-solid fa-gauge-high"></i> Bảng điều khiển
          </a>
          <a href="dashboard.html#profile">
            <i class="fa-solid fa-id-card"></i> Hồ sơ cá nhân
          </a>
          <button type="button" id="navLogoutBtn">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </div>
    `;

    document.getElementById("userMenuToggle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      document.getElementById("userDropdown")?.classList.toggle("show");
    });

    document.getElementById("navLogoutBtn")?.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  } else {
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">
        <i class="fa-solid fa-arrow-right-to-bracket"></i> Đăng nhập
      </a>
      <a href="register.html" class="btn btn-primary btn-sm">
        <i class="fa-solid fa-user-plus"></i> Đăng ký
      </a>
    `;
  }
}

function setupDropdowns() {
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown && dropdown.classList.contains("show")) {
      dropdown.classList.remove("show");
    }
  });

  const toggleBtn = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener("click", () => {
      navLinks.classList.toggle("show");
    });
  }
}

function escapeHtml(text) {
  if (!text) return "";
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.toString().replace(/[&<>"']/g, (m) => map[m]);
}
