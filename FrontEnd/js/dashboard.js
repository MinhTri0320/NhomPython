// ==========================================================================
// DASHBOARD LOGIC (TRIS-27: RBAC Phân quyền vai trò & Giao diện)
// Hỗ trợ 3 vai trò: CANDIDATE (Ứng viên), RECRUITER (Nhà tuyển dụng), ADMIN (Quản trị viên)
// ==========================================================================

let currentUser = null;
let currentTab = "overview";

// Cấu hình menu sidebar theo từng vai trò (Role-Based Access Control)
const ROLE_MENUS = {
  CANDIDATE: [
    { id: "overview", label: "Tổng quan", icon: "fa-gauge-high" },
    { id: "profile", label: "Hồ sơ cá nhân & CV", icon: "fa-id-card" },
    { id: "applications", label: "Việc đã ứng tuyển", icon: "fa-paper-plane" },
    { id: "saved-jobs", label: "Việc làm đã lưu", icon: "fa-bookmark" },
  ],
  RECRUITER: [
    { id: "overview", label: "Tổng quan tuyển dụng", icon: "fa-chart-pie" },
    { id: "manage-jobs", label: "Quản lý tin tuyển dụng", icon: "fa-list-check" },
    { id: "candidate-apps", label: "Hồ sơ ứng viên", icon: "fa-users" },
    { id: "company-profile", label: "Thông tin công ty", icon: "fa-building" },
  ],
  ADMIN: [
    { id: "overview", label: "Tổng quan hệ thống", icon: "fa-chart-line" },
    { id: "manage-users", label: "Quản lý người dùng", icon: "fa-users-gear" },
    { id: "moderate-jobs", label: "Phê duyệt tin tuyển dụng", icon: "fa-shield-halved" },
    { id: "system-logs", label: "Nhật ký & Cảnh báo", icon: "fa-triangle-exclamation" },
  ]
};

// Dữ liệu mẫu (mock/state) cho các tính năng Sprint 2-4 khi BackEnd chưa hoàn thiện API
let mockJobs = [
  { id: 101, title: "Backend Python Developer (FastAPI)", category: "Công nghệ thông tin", location: "Hà Nội", salary: "18 - 28 triệu", deadline: "2026-12-15", status: "APPROVED", applicants: 8 },
  { id: 102, title: "Frontend Vue / React Developer", category: "Công nghệ thông tin", location: "TP. Hồ Chí Minh", salary: "15 - 25 triệu", deadline: "2026-11-28", status: "APPROVED", applicants: 12 },
  { id: 103, title: "Chuyên viên Tuyển dụng (HR Recruitment)", category: "Nhân sự", location: "Đà Nẵng", salary: "10 - 15 triệu", deadline: "2026-11-20", status: "PENDING", applicants: 3 },
];

let mockApplications = [
  { id: 1, jobTitle: "Backend Python Developer (FastAPI)", company: "FPT Software", appliedDate: "2026-11-10", status: "REVIEWING", candidateName: "Trần Minh Trí", cvName: "CV_TranMinhTri_Python.pdf" },
  { id: 2, jobTitle: "Kỹ sư CSDL MySQL / Data Engineer", company: "Viettel Solutions", appliedDate: "2026-11-05", status: "INTERVIEW", candidateName: "Nguyễn Văn Nam", cvName: "CV_NguyenVanNam.pdf" },
  { id: 3, jobTitle: "Fullstack Web Developer", company: "VNG Corporation", appliedDate: "2026-10-28", status: "OFFERED", candidateName: "Lê Hoàng Anh", cvName: "CV_LeHoangAnh_Fullstack.pdf" },
  { id: 4, jobTitle: "Frontend Developer (UI/UX)", company: "Tiki Corp", appliedDate: "2026-10-15", status: "REJECTED", candidateName: "Phạm Thảo Linh", cvName: "CV_PhamThaoLinh.pdf" },
];

// Khởi chạy Dashboard
async function initDashboard() {
  if (!getToken()) {
    window.location.href = "login.html";
    return;
  }

  try {
    currentUser = await api("/api/auth/me");
  } catch (err) {
    clearSession();
    window.location.href = "login.html";
    return;
  }

  // Cập nhật thông tin Header & Topbar
  const initial = (currentUser.full_name || "U").charAt(0).toUpperCase();
  document.getElementById("topAvatar").textContent = initial;
  document.getElementById("sideAvatar").textContent = initial;
  document.getElementById("topUserName").textContent = currentUser.full_name;
  document.getElementById("sideUserName").textContent = currentUser.full_name;
  document.getElementById("sideUserEmail").textContent = currentUser.email;

  const roleBadgeClass = currentUser.role === "ADMIN" ? "badge-danger" : (currentUser.role === "RECRUITER" ? "badge-warning" : "badge-primary");
  const roleName = ROLE_NAMES[currentUser.role] || currentUser.role;

  const topRoleEl = document.getElementById("topUserRole");
  topRoleEl.className = "badge " + roleBadgeClass;
  topRoleEl.textContent = roleName;

  // Cảnh báo xác thực email nếu chưa xác thực
  if (!currentUser.email_verified) {
    document.getElementById("verifyBox").classList.remove("hidden");
  }

  // Xây dựng Menu Sidebar theo vai trò
  buildSidebarMenu(currentUser.role);

  // Đọc tab từ URL hash nếu có (ví dụ #profile)
  const hash = window.location.hash.replace("#", "");
  switchTab(hash || "overview");
}

// Xây dựng Sidebar Menu
function buildSidebarMenu(role) {
  const menuContainer = document.getElementById("sidebarMenu");
  menuContainer.innerHTML = "";

  const items = ROLE_MENUS[role] || ROLE_MENUS.CANDIDATE;
  items.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <button class="sidebar-menu-btn" data-tab="${item.id}" id="tabBtn_${item.id}">
        <i class="fa-solid ${item.icon}"></i>
        <span>${item.label}</span>
      </button>
    `;
    li.querySelector("button").addEventListener("click", () => switchTab(item.id));
    menuContainer.appendChild(li);
  });
}

// Chuyển đổi qua lại giữa các Tab (SPA View Switcher)
function switchTab(tabId) {
  currentTab = tabId;
  window.location.hash = tabId;

  // Cập nhật active class trên sidebar buttons
  document.querySelectorAll(".sidebar-menu-btn").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-tab") === tabId);
  });

  const content = document.getElementById("dashboardContent");
  const viewTitle = document.getElementById("viewTitle");
  const viewSubtitle = document.getElementById("viewSubtitle");
  const viewActions = document.getElementById("viewActions");
  viewActions.innerHTML = "";

  // Render theo vai trò và tab
  if (currentUser.role === "ADMIN") {
    renderAdminViews(tabId, content, viewTitle, viewSubtitle, viewActions);
  } else if (currentUser.role === "RECRUITER") {
    renderRecruiterViews(tabId, content, viewTitle, viewSubtitle, viewActions);
  } else {
    renderCandidateViews(tabId, content, viewTitle, viewSubtitle, viewActions);
  }
}

// ==========================================================================
// VIEWS CHO VAI TRÒ ADMIN (Quản trị viên)
// ==========================================================================
async function renderAdminViews(tabId, container, title, subtitle, actions) {
  if (tabId === "manage-users") {
    title.textContent = "Quản lý người dùng hệ thống";
    subtitle.textContent = "Xem danh sách và phân quyền tài khoản (API BackEnd /api/admin/users)";
    actions.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="switchTab('manage-users')">
        <i class="fa-solid fa-rotate"></i> Làm mới danh sách
      </button>
    `;

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table id="userTable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Xác thực email</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody id="userTableBody">
              <tr><td colspan="6" class="text-center" style="padding: 24px;">Đang tải dữ liệu từ máy chủ...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    try {
      const users = await api("/api/admin/users");
      const tbody = document.getElementById("userTableBody");
      tbody.innerHTML = "";

      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Chưa có người dùng nào.</td></tr>';
        return;
      }

      users.forEach(u => {
        const tr = document.createElement("tr");
        const roleBadge = u.role === "ADMIN" ? "badge-danger" : (u.role === "RECRUITER" ? "badge-warning" : "badge-primary");
        const verifiedBadge = u.email_verified ? '<span class="badge badge-success"><i class="fa-solid fa-check"></i> Đã xác thực</span>' : '<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Chưa xác thực</span>';
        
        tr.innerHTML = `
          <td><strong>#${u.id}</strong></td>
          <td><strong>${escapeHtml(u.full_name)}</strong></td>
          <td>${escapeHtml(u.email)}</td>
          <td><span class="badge ${roleBadge}">${ROLE_NAMES[u.role] || u.role}</span></td>
          <td>${verifiedBadge}</td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="alert('Chi tiết người dùng #' + ${u.id})">
              <i class="fa-solid fa-eye"></i> Xem
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      document.getElementById("userTableBody").innerHTML = `
        <tr><td colspan="6" class="text-center" style="color: var(--danger)">Không thể tải dữ liệu: ${err.message}</td></tr>
      `;
    }

  } else if (tabId === "moderate-jobs") {
    title.textContent = "Phê duyệt tin tuyển dụng";
    subtitle.textContent = "Kiểm duyệt nội dung tin tuyển dụng trước khi hiển thị công khai";
    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tiêu đề tin</th>
                <th>Doanh nghiệp</th>
                <th>Ngành nghề</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              ${mockJobs.map(j => `
                <tr>
                  <td>#${j.id}</td>
                  <td><strong>${j.title}</strong></td>
                  <td>Công ty TechVN</td>
                  <td>${j.category}</td>
                  <td><span class="badge ${j.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${j.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}</span></td>
                  <td>
                    <button class="btn btn-success btn-sm" onclick="alert('Đã phê duyệt tin #${j.id}')"><i class="fa-solid fa-check"></i> Duyệt</button>
                    <button class="btn btn-secondary btn-sm" onclick="alert('Đã từ chối tin #${j.id}')"><i class="fa-solid fa-xmark"></i> Từ chối</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else {
    // Overview Admin
    title.textContent = "Tổng quan hệ thống Quản trị";
    subtitle.textContent = "Theo dõi các chỉ số hoạt động toàn bộ nền tảng tuyển dụng";
    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="stat-val" id="statUserCount">--</div>
            <div class="stat-lbl">Tổng người dùng</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fa-solid fa-briefcase"></i></div>
          <div class="stat-val">28</div>
          <div class="stat-lbl">Tin tuyển dụng</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow"><i class="fa-solid fa-file-lines"></i></div>
          <div class="stat-val">142</div>
          <div class="stat-lbl">Hồ sơ ứng tuyển</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fa-solid fa-clock"></i></div>
          <div class="stat-val">5</div>
          <div class="stat-lbl">Tin cần duyệt</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-bolt"></i> Hoạt động gần đây của hệ thống</div>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('manage-users')">Xem danh sách người dùng &rarr;</button>
        </div>
        <p style="color: var(--text-muted); font-size: 0.9rem;">
          Hệ thống chạy trên nền tảng FastAPI + MySQL 8.0. Dữ liệu xác thực người dùng hoạt động qua JSON Web Token (JWT) và Refresh Token tự động làm mới khi hết hạn.
        </p>
      </div>
    `;

    // Cập nhật số user thực tế từ API BackEnd
    api("/api/admin/users").then(users => {
      const el = document.getElementById("statUserCount");
      if (el) el.textContent = users.length;
    }).catch(() => {});
  }
}

// ==========================================================================
// VIEWS CHO VAI TRÒ RECRUITER (Nhà tuyển dụng)
// ==========================================================================
function renderRecruiterViews(tabId, container, title, subtitle, actions) {
  if (tabId === "manage-jobs") {
    title.textContent = "Quản lý tin tuyển dụng";
    subtitle.textContent = "Đăng và theo dõi trạng thái các vị trí tuyển dụng của doanh nghiệp";
    actions.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openJobModal()">
        <i class="fa-solid fa-plus"></i> Đăng tin mới
      </button>
    `;

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Tiêu đề tin</th>
                <th>Địa điểm</th>
                <th>Mức lương</th>
                <th>Hạn nộp</th>
                <th>Số ứng viên</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${mockJobs.map(j => `
                <tr>
                  <td><strong>${j.title}</strong></td>
                  <td>${j.location}</td>
                  <td>${j.salary}</td>
                  <td>${j.deadline}</td>
                  <td><span class="badge badge-primary">${j.applicants} hồ sơ</span></td>
                  <td><span class="badge ${j.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${j.status === 'APPROVED' ? 'Đang tuyển' : 'Chờ duyệt'}</span></td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="switchTab('candidate-apps')"><i class="fa-solid fa-eye"></i> Xem ứng viên</button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (tabId === "candidate-apps") {
    title.textContent = "Hồ sơ ứng viên ứng tuyển";
    subtitle.textContent = "Xem xét và cập nhật trạng thái xử lý hồ sơ (Chờ duyệt, Phỏng vấn, Tuyển dụng)";
    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Họ tên ứng viên</th>
                <th>Vị trí ứng tuyển</th>
                <th>Ngày nộp</th>
                <th>CV đính kèm</th>
                <th>Trạng thái</th>
                <th>Cập nhật trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${mockApplications.map(a => {
                const s = APP_STATUS_NAMES[a.status] || { label: a.status, badge: "badge-neutral" };
                return `
                  <tr>
                    <td><strong>${a.candidateName}</strong></td>
                    <td>${a.jobTitle}</td>
                    <td>${a.appliedDate}</td>
                    <td><a href="#" onclick="alert('Tải xuống CV: ${a.cvName}'); return false;"><i class="fa-solid fa-file-pdf" style="color: var(--danger)"></i> ${a.cvName}</a></td>
                    <td><span class="badge ${s.badge}">${s.label}</span></td>
                    <td>
                      <select class="form-select" style="padding: 4px 8px; font-size: 0.8rem; width: auto;" onchange="alert('Đã đổi trạng thái hồ sơ sang: ' + this.value)">
                        <option value="PENDING" ${a.status === 'PENDING' ? 'selected' : ''}>Chờ duyệt</option>
                        <option value="REVIEWING" ${a.status === 'REVIEWING' ? 'selected' : ''}>Đang xem xét</option>
                        <option value="INTERVIEW" ${a.status === 'INTERVIEW' ? 'selected' : ''}>Mời phỏng vấn</option>
                        <option value="OFFERED" ${a.status === 'OFFERED' ? 'selected' : ''}>Trúng tuyển</option>
                        <option value="REJECTED" ${a.status === 'REJECTED' ? 'selected' : ''}>Từ chối</option>
                      </select>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (tabId === "company-profile") {
    title.textContent = "Hồ sơ thông tin công ty";
    subtitle.textContent = "Cập nhật thương hiệu tuyển dụng, logo và thông tin giới thiệu công ty";
    container.innerHTML = `
      <div class="card" style="max-width: 720px;">
        <form onsubmit="event.preventDefault(); alert('Đã lưu thông tin công ty thành công!');">
          <div class="form-group">
            <label class="form-label">Tên công ty / Tập đoàn</label>
            <input type="text" class="form-control" value="Công ty TNHH Giải pháp Công nghệ Việt">
          </div>
          <div class="form-group">
            <label class="form-label">Địa chỉ trụ sở</label>
            <input type="text" class="form-control" value="Tầng 12, Tòa nhà Keangnam, Nam Từ Liêm, Hà Nội">
          </div>
          <div class="form-group">
            <label class="form-label">Trang web (Website)</label>
            <input type="url" class="form-control" value="https://techviet-solutions.example.com">
          </div>
          <div class="form-group">
            <label class="form-label">Giới thiệu về công ty</label>
            <textarea class="form-control" rows="4">Doanh nghiệp công nghệ hàng đầu chuyên cung cấp giải pháp chuyển đổi số, phần mềm quản lý và tuyển dụng nhân sự chất lượng cao.</textarea>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi</button>
        </form>
      </div>
    `;

  } else {
    // Recruiter Overview
    title.textContent = "Bảng tin tuyển dụng";
    subtitle.textContent = "Theo dõi nhanh hiệu quả các chiến dịch tuyển dụng đang diễn ra";
    actions.innerHTML = `
      <button class="btn btn-primary btn-sm" onclick="openJobModal()">
        <i class="fa-solid fa-plus"></i> Đăng tin mới
      </button>
    `;

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fa-solid fa-bullhorn"></i></div>
          <div>
            <div class="stat-val">${mockJobs.length}</div>
            <div class="stat-lbl">Tin đang tuyển</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fa-solid fa-users"></i></div>
          <div>
            <div class="stat-val">23</div>
            <div class="stat-lbl">Ứng viên đã nộp</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow"><i class="fa-solid fa-hourglass-half"></i></div>
          <div>
            <div class="stat-val">7</div>
            <div class="stat-lbl">Hồ sơ chờ xem</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fa-solid fa-bell"></i></div>
          <div>
            <div class="stat-val">1</div>
            <div class="stat-lbl">Tin sắp hết hạn</div>
          </div>
        </div>
      </div>

      <!-- Cảnh báo tuyển dụng gần hết hạn -->
      <div class="notice-box">
        <div class="d-flex align-center gap-2">
          <i class="fa-solid fa-circle-exclamation"></i>
          <div><strong>Cảnh báo hạn tin tuyển dụng:</strong> Tin "Frontend Vue / React Developer" sẽ hết hạn trong 3 ngày tới!</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="alert('Đã gia hạn tin thêm 30 ngày')">Gia hạn ngay</button>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-list-check"></i> Các tin tuyển dụng mới nhất</div>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('manage-jobs')">Xem tất cả tin</button>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vị trí</th>
                <th>Hạn nộp</th>
                <th>Ứng viên</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${mockJobs.slice(0, 3).map(j => `
                <tr>
                  <td><strong>${j.title}</strong></td>
                  <td>${j.deadline}</td>
                  <td><span class="badge badge-primary">${j.applicants} hồ sơ</span></td>
                  <td><span class="badge ${j.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}">${j.status === 'APPROVED' ? 'Đang tuyển' : 'Chờ duyệt'}</span></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// ==========================================================================
// VIEWS CHO VAI TRÒ CANDIDATE (Ứng viên)
// ==========================================================================
function renderCandidateViews(tabId, container, title, subtitle, actions) {
  if (tabId === "profile") {
    title.textContent = "Hồ sơ cá nhân & CV";
    subtitle.textContent = "Quản lý thông tin cá nhân và tài liệu CV để nhà tuyển dụng tiếp cận bạn";
    container.innerHTML = `
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
        <div class="card">
          <div class="card-header">
            <div class="card-title"><i class="fa-regular fa-user"></i> Thông tin cá nhân</div>
          </div>
          <form onsubmit="event.preventDefault(); alert('Đã lưu thông tin hồ sơ cá nhân thành công!');">
            <div class="form-group">
              <label class="form-label">Họ và tên</label>
              <input type="text" class="form-control" value="${escapeHtml(currentUser.full_name)}">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" class="form-control" value="${escapeHtml(currentUser.email)}" disabled>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
              <div class="form-group">
                <label class="form-label">Số điện thoại</label>
                <input type="text" class="form-control" placeholder="0987 654 321" value="0987123456">
              </div>
              <div class="form-group">
                <label class="form-label">Tỉnh / Thành phố</label>
                <input type="text" class="form-control" value="Hà Nội">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Vị trí mong muốn (Headline)</label>
              <input type="text" class="form-control" value="Backend Developer (Python / FastAPI / SQL)">
            </div>
            <div class="form-group">
              <label class="form-label">Giới thiệu bản thân (Summary)</label>
              <textarea class="form-control" rows="3">Lập trình viên nhiệt huyết, có kinh nghiệm xây dựng RESTful API với FastAPI, tối ưu hóa CSDL MySQL và làm việc theo quy trình Scrum/Agile.</textarea>
            </div>
            <button type="submit" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Lưu hồ sơ</button>
          </form>
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title"><i class="fa-solid fa-file-pdf"></i> Quản lý CV</div>
            </div>
            <div style="margin-bottom: 16px; padding: 12px; background: var(--secondary-light); border-radius: var(--radius-sm); border: 1px solid var(--border);">
              <div class="d-flex align-center justify-between">
                <div>
                  <strong>CV_Chuan_2026.pdf</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Mặc định • Tải lên 10/11/2026</div>
                </div>
                <span class="badge badge-success">Mặc định</span>
              </div>
            </div>
            <button class="btn btn-outline btn-block btn-sm" onclick="alert('Mở cửa sổ chọn file CV PDF / Docx')">
              <i class="fa-solid fa-cloud-arrow-up"></i> Tải lên CV mới
            </button>
          </div>
        </div>
      </div>
    `;

  } else if (tabId === "applications") {
    title.textContent = "Việc làm đã ứng tuyển";
    subtitle.textContent = "Theo dõi tiến độ và phản hồi từ các nhà tuyển dụng";
    actions.innerHTML = `
      <a href="jobs.html" class="btn btn-primary btn-sm">
        <i class="fa-solid fa-magnifying-glass"></i> Tìm thêm việc làm
      </a>
    `;

    container.innerHTML = `
      <div class="card">
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vị trí ứng tuyển</th>
                <th>Công ty</th>
                <th>Ngày nộp</th>
                <th>Trạng thái xử lý</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              ${mockApplications.map(a => {
                const s = APP_STATUS_NAMES[a.status] || { label: a.status, badge: "badge-neutral" };
                return `
                  <tr>
                    <td><strong>${a.jobTitle}</strong></td>
                    <td>${a.company}</td>
                    <td>${a.appliedDate}</td>
                    <td><span class="badge ${s.badge}">${s.label}</span></td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="alert('Xem chi tiết tiến trình nộp hồ sơ cho ${a.jobTitle}')">Chi tiết</button>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

  } else if (tabId === "saved-jobs") {
    title.textContent = "Việc làm đã lưu";
    subtitle.textContent = "Danh sách các vị trí bạn quan tâm để ứng tuyển sau";
    container.innerHTML = `
      <div class="job-grid">
        ${mockJobs.slice(0, 2).map(j => `
          <div class="job-card">
            <div class="job-card-header">
              <div class="company-logo"><i class="fa-solid fa-building"></i></div>
              <div class="job-info">
                <div class="job-title">${j.title}</div>
                <div class="job-company">Công ty Công nghệ Quốc tế</div>
              </div>
            </div>
            <div class="job-details">
              <span class="job-detail-item"><i class="fa-solid fa-location-dot"></i> ${j.location}</span>
              <span class="job-detail-item job-salary"><i class="fa-solid fa-money-bill-wave"></i> ${j.salary}</span>
            </div>
            <div class="job-card-footer">
              <span>Hạn nộp: ${j.deadline}</span>
              <a href="job-detail.html?id=${j.id}" class="btn btn-primary btn-sm">Ứng tuyển ngay</a>
            </div>
          </div>
        `).join("")}
      </div>
    `;

  } else {
    // Candidate Overview
    title.textContent = "Bảng điều khiển Ứng viên";
    subtitle.textContent = "Chào mừng bạn! Hãy hoàn thiện hồ sơ và tìm kiếm công việc mơ ước";
    actions.innerHTML = `
      <a href="jobs.html" class="btn btn-primary btn-sm">
        <i class="fa-solid fa-magnifying-glass"></i> Tìm việc làm ngay
      </a>
    `;

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="stat-icon blue"><i class="fa-solid fa-paper-plane"></i></div>
          <div>
            <div class="stat-val">${mockApplications.length}</div>
            <div class="stat-lbl">Đã ứng tuyển</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green"><i class="fa-solid fa-comments"></i></div>
          <div>
            <div class="stat-val">1</div>
            <div class="stat-lbl">Lời mời phỏng vấn</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon yellow"><i class="fa-solid fa-bookmark"></i></div>
          <div>
            <div class="stat-val">2</div>
            <div class="stat-lbl">Việc làm đã lưu</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon red"><i class="fa-solid fa-circle-check"></i></div>
          <div>
            <div class="stat-val">85%</div>
            <div class="stat-lbl">Hoàn thiện hồ sơ</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fa-solid fa-clock-rotate-left"></i> Trạng thái hồ sơ gần đây</div>
          <button class="btn btn-secondary btn-sm" onclick="switchTab('applications')">Xem tất cả</button>
        </div>
        <div class="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Vị trí</th>
                <th>Công ty</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${mockApplications.slice(0, 3).map(a => {
                const s = APP_STATUS_NAMES[a.status] || { label: a.status, badge: "badge-neutral" };
                return `
                  <tr>
                    <td><strong>${a.jobTitle}</strong></td>
                    <td>${a.company}</td>
                    <td>${a.appliedDate}</td>
                    <td><span class="badge ${s.badge}">${s.label}</span></td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// Modal Thêm tin tuyển dụng
function openJobModal() {
  document.getElementById("jobModal")?.classList.add("show");
}
function closeJobModal() {
  document.getElementById("jobModal")?.classList.remove("show");
}

document.getElementById("newJobForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const form = e.target;
  const newJob = {
    id: Date.now(),
    title: form.title.value,
    category: form.category.value,
    location: form.location.value,
    salary: (form.salary_min.value ? form.salary_min.value / 1000000 : 10) + " - " + (form.salary_max.value ? form.salary_max.value / 1000000 : 20) + " triệu",
    deadline: form.deadline.value,
    status: "APPROVED",
    applicants: 0
  };
  mockJobs.unshift(newJob);
  closeJobModal();
  alert("Đăng tin tuyển dụng thành công!");
  switchTab("manage-jobs");
});

// Gửi lại email xác thực
document.getElementById("resendBtn")?.addEventListener("click", async () => {
  const box = document.getElementById("verifyMsg");
  try {
    const data = await api("/api/auth/resend-verification", { method: "POST" });
    showMessage(box, data.message || "Đã gửi lại email xác thực. Hãy kiểm tra hộp thư hoặc log BackEnd!", true);
  } catch (err) {
    showMessage(box, err.message, false);
  }
});

// Đăng xuất
document.getElementById("logoutBtn")?.addEventListener("click", logout);

document.addEventListener("DOMContentLoaded", initDashboard);
