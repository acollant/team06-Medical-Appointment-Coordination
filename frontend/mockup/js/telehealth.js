/** Call doctor + telehealth fallback (US-4.9, US-4.10) */

function getOnlineMeetings(serviceId) {
  const map = FIXTURES.onlineMeetingsByService || {};
  return map[serviceId] || [];
}

function getPrimaryProviderForService(serviceId) {
  const providers = getProvidersForService(serviceId);
  return providers.find((p) => p.telehealth) || providers[0] || null;
}

function getProvidersForService(serviceId) {
  const service = getServiceById(serviceId);
  if (!service) return [];
  return (FIXTURES.providers || []).filter(
    (p) => p.phone && service.specialties.includes(p.specialty)
  );
}

function getCallableProviders(serviceId = null) {
  const all = (FIXTURES.providers || []).filter((p) => p.phone);
  if (!serviceId) return all;
  return getProvidersForService(serviceId);
}

function getProviderById(providerId) {
  return (FIXTURES.providers || []).find((p) => String(p.id) === String(providerId)) || null;
}

function formatPhoneDisplay(phone) {
  if (!phone) return "";
  const digits = phone.replace(/[^\d+]/g, "");
  const m = digits.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return phone;
}

function phoneTelHref(phone) {
  if (!phone) return "";
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function initiateDoctorCall(provider) {
  if (!provider?.phone) {
    showToast("Phone number not available", "error");
    return false;
  }
  showToast(`Calling ${provider.name}…`, "success");
  window.location.href = phoneTelHref(provider.phone);
  return true;
}

function initiateDoctorCallById(providerId) {
  return initiateDoctorCall(getProviderById(providerId));
}

function renderMobileCallDoctorList(containerEl, serviceId = null) {
  if (!containerEl) return;
  const providers = getCallableProviders(serviceId);
  const services = FIXTURES.services || [];

  const filterHtml = `
    <div class="call-filter" role="tablist" aria-label="Filter by service">
      <button type="button" class="call-filter-btn${serviceId ? "" : " active"}" data-call-filter="">All</button>
      ${services.map((s) =>
        `<button type="button" class="call-filter-btn${serviceId === s.id ? " active" : ""}" data-call-filter="${s.id}">${s.patientLabel}</button>`
      ).join("")}
    </div>`;

  if (!providers.length) {
    containerEl.innerHTML = filterHtml + `<div class="empty-state" style="padding:24px 16px;">No doctors available to call right now.</div>`;
    bindCallFilterButtons(containerEl);
    return;
  }

  const listHtml = providers.map((p) => `
    <div class="call-doctor-card">
      <div class="call-doctor-info">
        <strong>${escapeCallHtml(p.name)}</strong>
        <p>${escapeCallHtml(p.specialty)} · ${escapeCallHtml(p.location || "")}</p>
        <p class="call-doctor-phone">${escapeCallHtml(formatPhoneDisplay(p.phone))}</p>
      </div>
      <a href="${phoneTelHref(p.phone)}" class="call-doctor-btn" aria-label="Call ${escapeCallHtml(p.name)}">Call</a>
    </div>
  `).join("");

  containerEl.innerHTML = `
    ${filterHtml}
    <p class="call-panel-note">Tap <strong>Call</strong> to speak with a doctor. Standard carrier rates may apply.</p>
    <div class="call-doctor-list">${listHtml}</div>
  `;

  bindCallFilterButtons(containerEl);

  containerEl.querySelectorAll(".call-doctor-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("aria-label")?.replace("Call ", "") || "doctor";
      showToast(`Calling ${name}…`, "success");
    });
  });
}

function bindCallFilterButtons(containerEl) {
  containerEl.querySelectorAll("[data-call-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const filter = btn.dataset.callFilter || null;
      renderMobileCallDoctorList(containerEl, filter || null);
    });
  });
}

function escapeCallHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
