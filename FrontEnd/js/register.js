const form = document.getElementById("registerForm");
const msg = document.getElementById("msg");
const companyBox = document.getElementById("companyBox");

function toggleCompany() {
  companyBox.classList.toggle("hidden", form.role.value !== "RECRUITER");
}
form.role.addEventListener("change", toggleCompany);
toggleCompany();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  const body = {
    full_name: form.full_name.value,
    email: form.email.value,
    password: form.password.value,
    role: form.role.value,
  };
  if (form.role.value === "RECRUITER") body.company_name = form.company_name.value;
  try {
    await api("/api/auth/register", { method: "POST", body: JSON.stringify(body) });
    showMessage(msg, "Đăng ký thành công! Hãy kiểm tra email để xác thực tài khoản. Đang chuyển sang trang đăng nhập...", true);
    setTimeout(() => (window.location.href = "login.html"), 2500);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});
