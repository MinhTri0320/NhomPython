// ==========================================================================
// EMAIL VERIFICATION LOGIC (TRIS-15: Xác thực email)
// ==========================================================================

document.addEventListener("DOMContentLoaded", async () => {
  const result = document.getElementById("result");
  const statusIcon = document.getElementById("statusIcon");
  const statusTitle = document.getElementById("statusTitle");
  const actionBtn = document.getElementById("actionBtn");
  const token = getQueryParam("token");

  if (!token) {
    statusIcon.style.background = "var(--danger-bg)";
    statusIcon.style.color = "var(--danger)";
    statusIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
    statusTitle.textContent = "Thiếu mã xác thực";
    showMessage(result, "Liên kết không hợp lệ: không tìm thấy mã xác thực email. Vui lòng kiểm tra lại email hoặc đăng nhập để gửi lại.", false);
    return;
  }

  try {
    const data = await api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token: token }),
    });

    statusIcon.style.background = "var(--success-bg)";
    statusIcon.style.color = "var(--success)";
    statusIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    statusTitle.textContent = "Xác thực thành công!";
    showMessage(result, data.message || "Email của bạn đã được xác thực thành công. Bạn có thể sử dụng đầy đủ các tính năng!", true);

    const user = getUser();
    if (user) {
      user.email_verified = true;
      localStorage.setItem("user", JSON.stringify(user));
      actionBtn.href = "dashboard.html";
      actionBtn.innerHTML = '<i class="fa-solid fa-gauge-high"></i> Vào Bảng điều khiển';
    }

  } catch (err) {
    statusIcon.style.background = "var(--danger-bg)";
    statusIcon.style.color = "var(--danger)";
    statusIcon.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    statusTitle.textContent = "Xác thực không thành công";
    showMessage(result, err.message, false);
  }
});
