const form = document.getElementById("forgotForm");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  try {
    const data = await api("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: form.email.value }),
    });
    showMessage(msg, data.message, true);
  } catch (err) {
    showMessage(msg, err.message, false);
  }
});
