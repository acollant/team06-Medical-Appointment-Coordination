function loginAs(personaId, options = {}) {
  setSession(personaId);
  const persona = FIXTURES.personas[personaId];
  showToast(`Signed in as ${persona.name}`, "success");
  const useMobile = options.mobile || (personaId === "P-1" && options.preferMobile);
  const target = useMobile && persona.mobileDashboard ? persona.mobileDashboard : persona.dashboard;
  setTimeout(() => {
    window.location.href = target;
  }, 400);
}

function handleLoginForm(e) {
  e.preventDefault();
  const email = e.target.email.value.trim().toLowerCase();
  const match = Object.values(FIXTURES.personas).find((p) => p.email === email);
  if (match) {
    const preferMobile = match.id === "P-1" && window.matchMedia("(max-width: 768px)").matches;
    loginAs(match.id, { preferMobile });
  } else {
    showToast("Invalid email or password", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-login-as]").forEach((btn) => {
    btn.addEventListener("click", () => {
      loginAs(btn.dataset.loginAs, { mobile: btn.dataset.mobile === "true" });
    });
  });

  const form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", handleLoginForm);

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Account created — signed in as Patient", "success");
      loginAs("P-1", { mobile: window.matchMedia("(max-width: 768px)").matches });
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
