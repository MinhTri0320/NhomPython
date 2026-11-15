// ==========================================================================
// LOGIN LOGIC (TRIS-19: Đăng nhập / đăng xuất)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Nếu đã đăng nhập, tự động chuyển đến Dashboard
  if (isLoggedIn()) {
    window.location.href = "dashboard.html";
    return;
  }

  const form = document.getElementById("loginForm");
  const msg = document.getElementById("msg");
  const submitBtn = document.getElementById("submitBtn");
  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eyeIcon");

  // Hiện / ẩn mật khẩu
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPass = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPass ? "text" : "password");
      eyeIcon.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  }

  // Tiện ích điền nhanh tài khoản demo
  document.getElementById("btnDemoAdmin")?.addEventListener("click", () => {
    form.email.value = "admin@example.com";
    form.password.value = "Admin@123";
  });

  document.getElementById("btnDemoCandidate")?.addEventListener("click", () => {
    form.email.value = "candidate@example.com";
    form.password.value = "Candidate@123";
  });

  document.getElementById("btnDemoRecruiter")?.addEventListener("click", () => {
    form.email.value = "recruiter@example.com";
    form.password.value = "Recruiter@123";
  });

  // Xử lý gửi form đăng nhập
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...';

    try {
      const data = await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.value.trim(),
          password: form.password.value,
        }),
      });

      saveSession(data);
      showMessage(msg, "Đăng nhập thành công! Đang chuyển hướng...", true);
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);

    } catch (err) {
      showMessage(msg, err.message, false);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
});
