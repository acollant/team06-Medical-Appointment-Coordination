/** Service-based availability search (US-4.6) */

function getServiceById(serviceId) {
  return FIXTURES.services.find((s) => s.id === serviceId);
}

function searchAvailabilityByService(serviceId, options = {}) {
  const { location = "Main Clinic", fromDate = null } = options;
  let results = FIXTURES.availabilityByService.filter((slot) => slot.serviceId === serviceId);

  if (location) {
    results = results.filter((slot) => slot.location === location);
  }
  if (fromDate) {
    results = results.filter((slot) => slot.date >= fromDate);
  }

  return results.sort((a, b) => {
    const da = `${a.date}T${a.time}`;
    const db = `${b.date}T${b.time}`;
    return da.localeCompare(db);
  });
}

function groupAvailabilityByDate(slots) {
  return slots.reduce((acc, slot) => {
    if (!acc[slot.dateLabel]) acc[slot.dateLabel] = [];
    acc[slot.dateLabel].push(slot);
    return acc;
  }, {});
}

function renderServiceCards(container, selectedId, onSelect) {
  container.innerHTML = FIXTURES.services
    .map(
      (svc) => `
    <button type="button" class="service-card ${selectedId === svc.id ? "selected" : ""}" data-service="${svc.id}">
      <span class="service-card-title">${svc.patientLabel}</span>
      <span class="service-card-sub">${svc.label}${svc.ivrOption ? ` · IVR [${svc.ivrOption}]` : ""}</span>
      <span class="service-card-desc">${svc.description}</span>
    </button>`
    )
    .join("");

  container.querySelectorAll("[data-service]").forEach((btn) => {
    btn.addEventListener("click", () => onSelect(btn.dataset.service));
  });
}

function renderAvailabilityResults(container, serviceId, location) {
  const service = getServiceById(serviceId);
  const slots = searchAvailabilityByService(serviceId, { location });
  const el = container;

  if (!slots.length) {
    el.innerHTML = `<div class="empty-state">
      <p>No open appointments for <strong>${service?.patientLabel || serviceId}</strong> at ${location}.</p>
      <p>Try another service or check back later.</p>
    </div>`;
    return;
  }

  const grouped = groupAvailabilityByDate(slots);
  el.innerHTML = `
    <div class="results-header">
      <p><strong>${slots.length}</strong> open slot${slots.length === 1 ? "" : "s"} for
      <strong>${service.patientLabel}</strong> · ${location}</p>
    </div>
    ${Object.entries(grouped)
      .map(
        ([dateLabel, daySlots]) => `
      <div class="availability-day">
        <h3 class="availability-day-title">${dateLabel}</h3>
        <div class="availability-list">
          ${daySlots
            .map(
              (slot) => `
            <div class="availability-row card">
              <div class="availability-row-main">
                <span class="availability-time">${slot.time}</span>
                <div>
                  <strong>${slot.provider}</strong>
                  <p>${slot.type} · ${slot.location}</p>
                </div>
              </div>
              <a href="book.html?provider=${encodeURIComponent(slot.provider)}&date=${slot.date}&time=${slot.time}&service=${slot.serviceId}&type=${encodeURIComponent(slot.type)}"
                 class="btn btn-primary btn-sm">Book</a>
            </div>`
            )
            .join("")}
        </div>
      </div>`
      )
      .join("")}`;
}
