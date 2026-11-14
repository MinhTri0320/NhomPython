const form = document.getElementById("resetForm");
const msg = document.getElementById("msg");
const token = getQueryParam("token");

if (!token) {
  showMessage(msg, "Liên kết không hợp lệ: thiếu mã đặt lại mật khẩu. Hãy yêu cầu gửi lại.", false);
  form.querySelector("button").disabled = true;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  if (form.new_password.value !== form.confirm_password.value) {
    showMessage(msg, "Hai mật khẩu không khớp", false);
    return;
  }
  try {
    const data = await api("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: token, new_password: form.new_password.value }),
    });
    showMessage(msg, data.message + ". Đang chuyển sang trang đăng nhập...", true);
    clearSession();
    setTimeout(() => (window.location.href = "login.html"), 1500);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});
