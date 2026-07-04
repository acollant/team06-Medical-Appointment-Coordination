function loginAs(personaId) {
  setSession(personaId);
  const persona = FIXTURES.personas[personaId];
  showToast(`Signed in as ${persona.name}`, "success");
  setTimeout(() => {
    window.location.href = persona.dashboard;
  }, 400);
}

function handleLoginForm(e) {
  e.preventDefault();
  const email = e.target.email.value.trim().toLowerCase();
  const match = Object.values(FIXTURES.personas).find((p) => p.email === email);
  if (match) {
    loginAs(match.id);
  } else {
    showToast("Invalid email or password", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-login-as]").forEach((btn) => {
    btn.addEventListener("click", () => loginAs(btn.dataset.loginAs));
  });

  const form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", handleLoginForm);

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Account created — signed in as Patient", "success");
      loginAs("P-1");
    });
  }

  const forgotForm = document.getElementById("forgot-form");
  if (forgotForm) {
    forgotForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("If an account exists, a reset link was sent", "success");
    });
  }
});
