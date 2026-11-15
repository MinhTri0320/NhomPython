// ==========================================================================
// JOBS SEARCH & LISTING LOGIC
// ==========================================================================

const allJobs = [
  {
    id: 1,
    title: "Lập trình viên Backend Python (FastAPI)",
    company: "FPT Software",
    category: "IT",
    location: "Hà Nội",
    salaryMin: 18,
    salaryMax: 30,
    salaryText: "18 - 30 triệu",
    type: "Toàn thời gian",
    deadline: "30/11/2026",
    tags: ["Python", "FastAPI", "MySQL", "Docker"],
    desc: "Tham gia phát triển các dịch vụ backend hiệu năng cao sử dụng FastAPI, thiết kế kiến trúc RESTful API và tối ưu truy vấn MySQL."
  },
  {
    id: 2,
    title: "Chuyên viên Quản trị CSDL (Database Administrator)",
    company: "Viettel Solutions",
    category: "IT",
    location: "Hà Nội",
    salaryMin: 20,
    salaryMax: 35,
    salaryText: "20 - 35 triệu",
    type: "Toàn thời gian",
    deadline: "15/12/2026",
    tags: ["MySQL", "SQL Server", "Performance Tuning"],
    desc: "Thiết kế, triển khai sao lưu, phục hồi thảm họa và tối ưu hóa hiệu năng các hệ thống CSDL quan hệ quy mô lớn."
  },
  {
    id: 3,
    title: "Frontend Web Developer (Vue / JavaScript)",
    company: "VNG Corporation",
    category: "IT",
    location: "TP. Hồ Chí Minh",
    salaryMin: 16,
    salaryMax: 26,
    salaryText: "16 - 26 triệu",
    type: "Toàn thời gian",
    deadline: "05/12/2026",
    tags: ["JavaScript", "HTML/CSS", "UI/UX", "REST API"],
    desc: "Xây dựng giao diện web mượt mà, chuẩn UI/UX, tích hợp các API từ máy chủ và tối ưu hóa trải nghiệm trên mọi thiết bị."
  },
  {
    id: 4,
    title: "Chuyên viên Tuyển dụng Nhân sự (Senior IT Recruiter)",
    company: "Tiki Corp",
    category: "HR",
    location: "TP. Hồ Chí Minh",
    salaryMin: 15,
    salaryMax: 22,
    salaryText: "15 - 22 triệu",
    type: "Toàn thời gian",
    deadline: "25/11/2026",
    tags: ["HR", "IT Sourcing", "Interviewing"],
    desc: "Tìm kiếm, sàng lọc hồ sơ, phỏng vấn và quản lý quy trình tuyển dụng các vị trí công nghệ thông tin cho doanh nghiệp."
  },
  {
    id: 5,
    title: "Chuyên viên Marketing số (Digital Marketing Specialist)",
    company: "Shopee Việt Nam",
    category: "MARKETING",
    location: "Đà Nẵng",
    salaryMin: 12,
    salaryMax: 18,
    salaryText: "12 - 18 triệu",
    type: "Toàn thời gian",
    deadline: "10/12/2026",
    tags: ["SEO", "Google Ads", "Content", "Social"],
    desc: "Lên chiến lược và triển khai các chiến dịch quảng cáo kỹ thuật số, tối ưu hóa công cụ tìm kiếm và phân tích số liệu chuyển đổi."
  },
  {
    id: 6,
    title: "Thực tập sinh Lập trình Web (Web Developer Intern)",
    company: "VNPT Technology",
    category: "IT",
    location: "Hà Nội",
    salaryMin: 5,
    salaryMax: 8,
    salaryText: "5 - 8 triệu",
    type: "Thực tập",
    deadline: "20/12/2026",
    tags: ["Python", "JavaScript", "Internship"],
    desc: "Cơ hội đào tạo chuyên sâu dành cho sinh viên chuẩn bị tốt nghiệp. Được hướng dẫn trực tiếp bởi các Senior Developer."
  }
];

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("searchJobsForm");
  const keywordInput = document.getElementById("keyword");
  const categorySelect = document.getElementById("category");
  const locationSelect = document.getElementById("location");
  const container = document.getElementById("jobsContainer");
  const countText = document.getElementById("jobCountText");

  // Đọc query params từ URL nếu có
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("keyword")) keywordInput.value = urlParams.get("keyword");
  if (urlParams.get("category")) categorySelect.value = urlParams.get("category");
  if (urlParams.get("location")) locationSelect.value = urlParams.get("location");

  function renderJobs() {
    const kw = (keywordInput.value || "").trim().toLowerCase();
    const cat = categorySelect.value;
    const loc = locationSelect.value;

    const filtered = allJobs.filter(job => {
      const matchKw = !kw || job.title.toLowerCase().includes(kw) || job.company.toLowerCase().includes(kw) || job.tags.some(t => t.toLowerCase().includes(kw));
      const matchCat = !cat || job.category === cat;
      const matchLoc = !loc || job.location.includes(loc);
      return matchKw && matchCat && matchLoc;
    });

    countText.textContent = `Tìm thấy ${filtered.length} việc làm phù hợp`;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 40px;">
          <i class="fa-solid fa-magnifying-glass" style="font-size: 2.5rem; color: var(--text-light); margin-bottom: 12px;"></i>
          <h3>Không tìm thấy việc làm phù hợp</h3>
          <p style="color: var(--text-muted); font-size: 0.9rem;">Hãy thử tìm kiếm với từ khóa khác hoặc bỏ bớt các điều kiện lọc.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(job => `
      <div class="job-card" style="margin-bottom: 16px;">
        <div class="job-card-header">
          <div class="company-logo">${job.company.charAt(0)}</div>
          <div class="job-info">
            <div class="job-title">
              <a href="job-detail.html?id=${job.id}" style="color: inherit;">${job.title}</a>
            </div>
            <div class="job-company">${job.company}</div>
          </div>
          <div>
            <a href="job-detail.html?id=${job.id}" class="btn btn-primary btn-sm">Ứng tuyển</a>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--secondary); margin-bottom: 12px;">${job.desc}</p>
        <div class="job-details">
          <span class="job-detail-item"><i class="fa-solid fa-location-dot"></i> ${job.location}</span>
          <span class="job-detail-item job-salary"><i class="fa-solid fa-money-bill-wave"></i> ${job.salaryText}</span>
          <span class="job-detail-item"><i class="fa-solid fa-briefcase"></i> ${job.type}</span>
          <span class="job-detail-item"><i class="fa-regular fa-clock"></i> Hạn: ${job.deadline}</span>
        </div>
        <div class="job-tags">
          ${job.tags.map(t => `<span class="job-tag">${t}</span>`).join("")}
        </div>
      </div>
    `).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    renderJobs();
  });

  document.getElementById("resetFilterBtn")?.addEventListener("click", () => {
    form.reset();
    renderJobs();
  });

  renderJobs();
});
