const SESSION_KEY = "medappt_session";
const APPT_KEY = "medappt_appointments";
const REMINDER_COOLDOWN_KEY = "medappt_reminder_cooldown";

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function setSession(personaId) {
  const persona = FIXTURES.personas[personaId];
  if (!persona) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(persona));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function requireAuth(allowedRoles) {
  const session = getSession();
  if (!session) {
    window.location.href = resolvePath("index.html");
    return null;
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    showToast("Access denied for your role", "error");
    window.location.href = resolvePath(session.dashboard);
    return null;
  }
  return session;
}

function resolvePath(target) {
  const depth = (window.location.pathname.match(/\//g) || []).length;
  const inSubdir = window.location.pathname.includes("/patient/") ||
    window.location.pathname.includes("/provider/") ||
    window.location.pathname.includes("/desk/") ||
    window.location.pathname.includes("/admin/");
  if (inSubdir && !target.includes("/")) {
    return "../" + target;
  }
  if (inSubdir && target.includes("/")) {
    return "../" + target;
  }
  return target;
}

function getAppointments() {
  try {
    const stored = localStorage.getItem(APPT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* use fixtures */
  }
  return [...FIXTURES.appointments];
}

function saveAppointments(list) {
  localStorage.setItem(APPT_KEY, JSON.stringify(list));
}

function statusBadge(status) {
  const safe = (status || "scheduled").replace(/\s+/g, "_").toLowerCase();
  return `<span class="badge badge-${safe}">${status}</span>`;
}

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function initShell(session, navItems, activeHref) {
  const userEl = document.querySelector("[data-user-name]");
  if (userEl && session) userEl.textContent = session.name;

  initDemoBanner();

  document.querySelectorAll("[data-logout]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearSession();
      window.location.href = resolvePath("index.html");
    });
  });

  document.querySelectorAll("nav a[data-nav]").forEach((link) => {
    if (link.getAttribute("href") === activeHref) {
      link.classList.add("active");
    }
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

function initDemoBanner() {
  if (document.querySelector(".demo-banner") || !document.querySelector(".app-shell")) return;
  const banner = document.createElement("div");
  banner.className = "demo-banner";
  banner.innerHTML =
    `Prototype demo · sample data only · <a href="${resolvePath("demo.html")}">Demo guide</a> · Sign out to switch persona`;
  const shell = document.querySelector(".app-shell");
  shell.insertBefore(banner, shell.firstChild);
}

function renderStatGrid(container, stats) {
  if (!container || !stats) return;
  container.innerHTML = `
    <div class="stat-card"><span class="stat-value">${stats.appointmentsToday}</span><span class="stat-label">Appointments today</span></div>
    <div class="stat-card"><span class="stat-value">${stats.checkedIn}</span><span class="stat-label">Checked in</span></div>
    <div class="stat-card"><span class="stat-value">${stats.openSlots}</span><span class="stat-label">Open slots</span></div>
    <div class="stat-card"><span class="stat-value">${stats.activeProviders}</span><span class="stat-label">Providers</span></div>`;
}

document.addEventListener("click", (e) => {
  if (e.target.matches("[data-close-modal]")) {
    closeModal(e.target.dataset.closeModal);
  }
  if (e.target.classList.contains("modal-overlay") && e.target.dataset.modal) {
    closeModal(e.target.dataset.modal);
  }
});
