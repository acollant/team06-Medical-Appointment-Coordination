/** Service-based availability search (US-4.6) + closest practitioner (US-4.7) */

const EARTH_RADIUS_KM = 6371;

function getServiceById(serviceId) {
  return FIXTURES.services.find((s) => s.id === serviceId);
}

function getProviderByName(name) {
  return FIXTURES.providers.find((p) => p.name === name);
}

function getProviderById(id) {
  return FIXTURES.providers.find((p) => p.id === id);
}

function getLocationById(locationId) {
  return (FIXTURES.locations || []).find((l) => l.id === locationId);
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistanceKm(km) {
  if (km == null || Number.isNaN(km)) return "";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km.toFixed(1)} km away`;
}

function getPatientCoords(override = {}) {
  const profile = FIXTURES.patientProfile || {};
  return {
    lat: override.lat ?? profile.lat,
    lng: override.lng ?? profile.lng,
    zip: override.zip ?? profile.zip,
    address: override.address ?? profile.address,
  };
}

function resolveSlotCoords(slot) {
  const provider = getProviderById(slot.providerId) || getProviderByName(slot.provider);
  if (provider?.lat != null && provider?.lng != null) {
    return { lat: provider.lat, lng: provider.lng, locationId: provider.locationId };
  }
  const loc = getLocationById(slot.locationId) || getLocationById(provider?.locationId);
  if (loc) return { lat: loc.lat, lng: loc.lng, locationId: loc.id };
  return { lat: null, lng: null, locationId: slot.locationId };
}

function enrichSlotWithDistance(slot, fromLat, fromLng) {
  const coords = resolveSlotCoords(slot);
  const distanceKm =
    fromLat != null && fromLng != null && coords.lat != null
      ? haversineKm(fromLat, fromLng, coords.lat, coords.lng)
      : null;
  return {
    ...slot,
    locationId: slot.locationId || coords.locationId,
    distanceKm,
    distanceLabel: formatDistanceKm(distanceKm),
  };
}

function searchAvailability(options = {}) {
  const {
    serviceId = null,
    specialty = null,
    location = null,
    locationId = null,
    fromDate = null,
    sortBy = "time",
    patientLat = null,
    patientLng = null,
  } = options;

  let results = [...(FIXTURES.availabilityByService || [])];

  if (serviceId) {
    results = results.filter((slot) => slot.serviceId === serviceId);
  }
  if (specialty) {
    const serviceIds = FIXTURES.services
      .filter((s) => s.specialties.includes(specialty))
      .map((s) => s.id);
    results = results.filter((slot) => serviceIds.includes(slot.serviceId));
  }
  if (location) {
    results = results.filter((slot) => slot.location === location);
  }
  if (locationId) {
    results = results.filter((slot) => slot.locationId === locationId);
  }
  if (fromDate) {
    results = results.filter((slot) => slot.date >= fromDate);
  }

  const coords = getPatientCoords({ lat: patientLat, lng: patientLng });
  results = results.map((slot) => enrichSlotWithDistance(slot, coords.lat, coords.lng));

  if (sortBy === "distance") {
    return results.sort((a, b) => {
      const dist = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      if (dist !== 0) return dist;
      return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
    });
  }

  return results.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}

function searchAvailabilityByService(serviceId, options = {}) {
  return searchAvailability({ ...options, serviceId });
}

/** Closest practitioner with an open slot for the requested service (US-4.7) */
function findClosestPractitioner(serviceId, options = {}) {
  const slots = searchAvailability({
    ...options,
    serviceId,
    sortBy: "distance",
  });

  if (!slots.length) {
    return { practitioner: null, slot: null, alternatives: [] };
  }

  const byProvider = new Map();
  for (const slot of slots) {
    const key = slot.providerId || slot.provider;
    if (!byProvider.has(key)) byProvider.set(key, slot);
  }

  const ranked = [...byProvider.values()].sort((a, b) => {
    const dist = (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
    if (dist !== 0) return dist;
    return `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`);
  });

  const bestSlot = ranked[0];
  const practitioner = getProviderById(bestSlot.providerId) || getProviderByName(bestSlot.provider);

  return {
    practitioner: practitioner
      ? { ...practitioner, distanceKm: bestSlot.distanceKm, distanceLabel: bestSlot.distanceLabel }
      : null,
    slot: bestSlot,
    alternatives: ranked.slice(1),
  };
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

function renderClosestMatch(container, serviceId, options = {}) {
  const service = getServiceById(serviceId);
  const { practitioner, slot, alternatives } = findClosestPractitioner(serviceId, options);
  const patient = getPatientCoords(options);

  if (!practitioner || !slot) {
    container.innerHTML = `<div class="empty-state">
      <p>No practitioners with open slots for <strong>${service?.patientLabel || serviceId}</strong> near you.</p>
      <p>Try another service or expand your search area.</p>
    </div>`;
    return;
  }

  container.innerHTML = `
    <div class="closest-match card highlight-card">
      <span class="badge badge-scheduled">Closest match</span>
      <h3>${practitioner.name} · ${practitioner.specialty}</h3>
      <p>${practitioner.location} · ${practitioner.distanceLabel}</p>
      <p>Next open: <strong>${slot.display}</strong> · ${slot.type}</p>
      <div class="card-actions">
        <a href="book.html?provider=${encodeURIComponent(slot.provider)}&date=${slot.date}&time=${slot.time}&service=${slot.serviceId}&type=${encodeURIComponent(slot.type)}"
           class="btn btn-primary btn-sm">Book this slot</a>
      </div>
    </div>
    ${
      alternatives.length
        ? `<p class="results-header">Other nearby practitioners (${alternatives.length})</p>
      ${alternatives
        .map(
          (alt) => `
        <div class="card alt-practitioner">
          <h3>${alt.provider}</h3>
          <p>${alt.location} · ${alt.distanceLabel}</p>
          <p>Next open: ${alt.display} · ${alt.type}</p>
          <div class="card-actions">
            <a href="book.html?provider=${encodeURIComponent(alt.provider)}&date=${alt.date}&time=${alt.time}&service=${alt.serviceId}&type=${encodeURIComponent(alt.type)}"
               class="btn btn-secondary btn-sm">Book</a>
          </div>
        </div>`
        )
        .join("")}`
        : ""
    }
    <p class="demo-note">Searching from ${patient.address || patient.zip || "your saved address"}</p>`;
}

function renderAvailabilityResults(container, serviceId, options = {}) {
  const service = getServiceById(serviceId);
  const sortBy = options.sortBy || "time";
  const slots = searchAvailabilityByService(serviceId, options);
  const el = container;

  if (!slots.length) {
    el.innerHTML = `<div class="empty-state">
      <p>No open appointments for <strong>${service?.patientLabel || serviceId}</strong>${options.location ? ` at ${options.location}` : ""}.</p>
      <p>Try another service, location, or check back later.</p>
    </div>`;
    return;
  }

  const grouped = groupAvailabilityByDate(slots);
  const sortLabel = sortBy === "distance" ? "sorted by distance" : "sorted by date";

  el.innerHTML = `
    <div class="results-header">
      <p><strong>${slots.length}</strong> open slot${slots.length === 1 ? "" : "s"} for
      <strong>${service.patientLabel}</strong>${options.location ? ` · ${options.location}` : ""} · ${sortLabel}</p>
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
                  <p>${slot.type} · ${slot.location}${slot.distanceLabel ? ` · ${slot.distanceLabel}` : ""}</p>
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

function populateLocationSelect(selectEl, includeAll = true) {
  const locations = FIXTURES.locations || [{ name: "Our Clinic" }];
  selectEl.innerHTML =
    (includeAll ? `<option value="">All locations</option>` : "") +
    locations
      .map((loc) => `<option value="${loc.name}">${loc.name}</option>`)
      .join("");
}
