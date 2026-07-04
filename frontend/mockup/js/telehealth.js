/** Telehealth fallback when no in-person slots (US-4.9) */

function getOnlineMeetings(serviceId) {
  const map = FIXTURES.onlineMeetingsByService || {};
  return map[serviceId] || [];
}

function getPrimaryProviderForService(serviceId) {
  const service = getServiceById(serviceId);
  if (!service) return null;
  const providers = (FIXTURES.providers || []).filter((p) =>
    service.specialties.includes(p.specialty)
  );
  return providers.find((p) => p.telehealth) || providers[0] || null;
}

function formatPhoneDisplay(phone) {
  if (!phone) return "";
  return phone.replace(/(\+1)(\d{3})(\d{3})(\d{4})/, "($2) $3-$4");
}

function initiateDoctorCall(provider) {
  if (!provider?.phone) {
    showToast("Phone number not available", "error");
    return false;
  }
  showToast(`Calling ${provider.name}…`, "success");
  window.location.href = `tel:${provider.phone.replace(/[^\d+]/g, "")}`;
  return true;
}
