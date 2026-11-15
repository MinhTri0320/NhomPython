// ==========================================================================
// REGISTER LOGIC (TRIS-15: Đăng ký tài khoản Ứng viên / Nhà tuyển dụng)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const msg = document.getElementById("msg");
  const submitBtn = document.getElementById("submitBtn");
  const companyBox = document.getElementById("companyBox");
  const companyInput = document.getElementById("company_name");
  const roleInput = document.getElementById("role");
  const nameLabel = document.getElementById("nameLabel");

  const optionCandidate = document.getElementById("roleOptionCandidate");
  const optionRecruiter = document.getElementById("roleOptionRecruiter");

  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eyeIcon");

  // Xử lý chọn vai trò (Role Picker Cards)
  function selectRole(role) {
    roleInput.value = role;
    if (role === "RECRUITER") {
      optionRecruiter.classList.add("selected");
      optionCandidate.classList.remove("selected");
      companyBox.classList.remove("hidden");
      companyInput.required = true;
      nameLabel.textContent = "Họ và tên người liên hệ (HR / Đại diện)";
    } else {
      optionCandidate.classList.add("selected");
      optionRecruiter.classList.remove("selected");
      companyBox.classList.add("hidden");
      companyInput.required = false;
      nameLabel.textContent = "Họ và tên của bạn";
    }
  }

  optionCandidate.addEventListener("click", () => selectRole("CANDIDATE"));
  optionRecruiter.addEventListener("click", () => selectRole("RECRUITER"));

  // Toggle xem mật khẩu
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPass = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPass ? "text" : "password");
      eyeIcon.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  }

  // Submit form đăng ký
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";

    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    if (password !== confirmPassword) {
      showMessage(msg, "Mật khẩu xác nhận không trùng khớp!", false);
      form.confirm_password.focus();
      return;
    }

    if (password.length < 8) {
      showMessage(msg, "Mật khẩu phải có độ dài tối thiểu 8 ký tự!", false);
      form.password.focus();
      return;
    }

    const payload = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      password: password,
      role: roleInput.value,
    };

    if (roleInput.value === "RECRUITER") {
      const compName = companyInput.value.trim();
      if (!compName) {
        showMessage(msg, "Vui lòng nhập tên công ty hoặc doanh nghiệp!", false);
        companyInput.focus();
        return;
      }
      payload.company_name = compName;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo tài khoản...';

    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showMessage(
        msg,
        "Đăng ký thành công! Hệ thống đã gửi link xác thực tài khoản vào email của bạn (hoặc kiểm tra log BackEnd nếu chưa cấu hình SMTP). Đang chuyển hướng đến đăng nhập...",
        true
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);

    } catch (err) {
      showMessage(msg, err.message, false);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
});
