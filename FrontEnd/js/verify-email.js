const result = document.getElementById("result");
const token = getQueryParam("token");

async function verify() {
  if (!token) {
    showMessage(result, "Liên kết không hợp lệ: thiếu mã xác thực.", false);
    return;
  }
  try {
    const data = await api("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token: token }),
    });
    showMessage(result, data.message, true);
    // Cập nhật trạng thái đã xác thực nếu người dùng đang đăng nhập
    const user = getUser();
    if (user) { user.email_verified = true; localStorage.setItem("user", JSON.stringify(user)); }
  } catch (err) {
    showMessage(result, err.message, false);
  }
}
verify();
