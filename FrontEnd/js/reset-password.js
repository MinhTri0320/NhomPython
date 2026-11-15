// ==========================================================================
// RESET PASSWORD LOGIC (TRIS-23: Quên / đặt lại mật khẩu)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("resetForm");
  const msg = document.getElementById("msg");
  const submitBtn = document.getElementById("submitBtn");
  const token = getQueryParam("token");

  const togglePasswordBtn = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("new_password");
  const eyeIcon = document.getElementById("eyeIcon");

  if (!token) {
    showMessage(msg, "Liên kết không hợp lệ hoặc thiếu mã token đặt lại mật khẩu. Vui lòng yêu cầu cấp lại.", false);
    submitBtn.disabled = true;
    return;
  }

  // Toggle xem mật khẩu
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPass = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPass ? "text" : "password");
      eyeIcon.className = isPass ? "fa-regular fa-eye-slash" : "fa-regular fa-eye";
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";

    const newPass = form.new_password.value;
    const confirmPass = form.confirm_password.value;

    if (newPass !== confirmPass) {
      showMessage(msg, "Hai mật khẩu không trùng khớp nhau!", false);
      form.confirm_password.focus();
      return;
    }

    if (newPass.length < 8) {
      showMessage(msg, "Mật khẩu phải có ít nhất 8 ký tự!", false);
      form.new_password.focus();
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đổi mật khẩu...';

    try {
      const data = await api("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({
          token: token,
          new_password: newPass,
        }),
      });

      showMessage(msg, (data.message || "Đặt lại mật khẩu thành công!") + " Đang chuyển sang trang đăng nhập...", true);
      clearSession();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 2000);

    } catch (err) {
      showMessage(msg, err.message, false);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
});
