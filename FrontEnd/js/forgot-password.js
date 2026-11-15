// ==========================================================================
// FORGOT PASSWORD LOGIC (TRIS-23: Quên / đặt lại mật khẩu)
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("forgotForm");
  const msg = document.getElementById("msg");
  const submitBtn = document.getElementById("submitBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";

    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang gửi yêu cầu...';

    try {
      const data = await api("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: form.email.value.trim() }),
      });

      showMessage(
        msg,
        (data.message || "Đã gửi liên kết đặt lại mật khẩu!") + " Vui lòng kiểm tra hộp thư đến (hoặc log uvicorn của BackEnd).",
        true
      );
      form.reset();
    } catch (err) {
      showMessage(msg, err.message, false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
});
