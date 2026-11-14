const form = document.getElementById("loginForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  try {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
      }),
    });
    saveSession(data);
    window.location.href = "dashboard.html";
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});
