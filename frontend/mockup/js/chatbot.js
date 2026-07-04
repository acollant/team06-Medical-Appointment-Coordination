/* Mobile patient chatbot — Our Clinic assistant (US-4.8, US-4.9, US-4.10) */

const CHATBOT = {
  state: "idle",
  pendingSlot: null,
  pendingOnlineSlot: null,
  pendingServiceId: null,
  lastSlots: [],
  lastOnlineSlots: [],
};

function chatFirstName() {
  const session = getSession();
  return session?.name?.split(" ")[0] || "there";
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function serviceQuickReplies() {
  return (FIXTURES.services || []).map((s) => ({
    id: `service_${s.id}`,
    label: s.patientLabel,
  }));
}

function chatBotReply(messagesEl, text, options = {}) {
  const { quickReplies = [], cards = [] } = options;
  const wrap = document.createElement("div");
  wrap.className = "chat-row chat-row-bot";
  wrap.innerHTML = `
    <div class="chat-avatar" aria-hidden="true">🏥</div>
    <div class="chat-bubble-wrap">
      <div class="chat-bubble chat-bubble-bot">${escapeHtml(text).replace(/\n/g, "<br>")}</div>
      ${quickReplies.length ? `<div class="chat-quick-replies">${quickReplies.map((q) =>
        `<button type="button" class="chat-chip" data-chat-action="${q.id}">${escapeHtml(q.label)}</button>`
      ).join("")}</div>` : ""}
      ${cards.length ? `<div class="chat-cards">${cards.map((c, i) =>
        `<div class="chat-card${c.highlight ? " chat-card-highlight" : ""}">
          <strong>${escapeHtml(c.title)}</strong>
          <p>${escapeHtml(c.subtitle)}</p>
          ${c.meta ? `<p class="chat-card-meta">${escapeHtml(c.meta)}</p>` : ""}
          <div class="chat-card-actions">
            ${c.action ? `<button type="button" class="chat-card-btn" data-chat-action="${c.action}" data-slot-index="${i}">${escapeHtml(c.actionLabel || "Select")}</button>` : ""}
            ${c.secondaryAction ? `<button type="button" class="chat-card-btn chat-card-btn-secondary" data-chat-action="${c.secondaryAction}">${escapeHtml(c.secondaryLabel || "Call")}</button>` : ""}
          </div>
        </div>`
      ).join("")}</div>` : ""}
    </div>`;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  bindChatActions(wrap);
}

function chatUserReply(messagesEl, text) {
  const wrap = document.createElement("div");
  wrap.className = "chat-row chat-row-user";
  wrap.innerHTML = `<div class="chat-bubble chat-bubble-user">${escapeHtml(text)}</div>`;
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function bindChatActions(container) {
  container.querySelectorAll("[data-chat-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      handleChatAction(btn.dataset.chatAction, btn.dataset.slotIndex !== "" ? Number(btn.dataset.slotIndex) : null);
    });
  });
}

function chatWelcome(messagesEl) {
  CHATBOT.state = "idle";
  chatBotReply(messagesEl, `Hi ${chatFirstName()}! I'm the Our Clinic assistant. I can help you book a visit, find the nearest doctor, call a doctor, or check your appointments.`, {
    quickReplies: [
      { id: "book_start", label: "Book appointment" },
      { id: "call_doctor_start", label: "Call a doctor" },
      { id: "closest_start", label: "Nearest doctor" },
      { id: "my_appointments", label: "My appointments" },
      { id: "help", label: "What can you do?" },
    ],
  });
}

function handleChatAction(action, slotIndex = null) {
  const messagesEl = document.getElementById("chat-messages");
  const labels = {
    book_start: "Book an appointment",
    closest_start: "Find the nearest doctor",
    my_appointments: "Show my appointments",
    my_reminders: "My reminders",
    help: "What can you do?",
    call_doctor_start: "Call a doctor",
    confirm_book: "Yes, book it",
    cancel_flow: "Cancel an appointment",
  };

  if (labels[action]) chatUserReply(messagesEl, labels[action]);
  else if (action.startsWith("service_")) {
    chatUserReply(messagesEl, getServiceById(action.replace("service_", ""))?.patientLabel || action);
  } else if (action.startsWith("book_slot_")) {
    chatUserReply(messagesEl, "Book this slot");
  } else if (action.startsWith("book_online_")) {
    chatUserReply(messagesEl, "Book online visit");
  } else if (action.startsWith("call_pick_")) {
    chatUserReply(messagesEl, getServiceById(action.replace("call_pick_", ""))?.patientLabel || "Call doctor");
  } else if (action.startsWith("call_provider_")) {
    const provider = getProviderById(action.replace("call_provider_", ""));
    chatUserReply(messagesEl, `Call ${provider?.name || "doctor"}`);
  } else if (action.startsWith("call_doctor_")) {
    const svc = getServiceById(action.replace("call_doctor_", ""));
    chatUserReply(messagesEl, `Call ${getPrimaryProviderForService(action.replace("call_doctor_", ""))?.name || "doctor"}`);
  } else if (action.startsWith("online_meeting_")) {
    const svc = getServiceById(action.replace("online_meeting_", ""));
    chatUserReply(messagesEl, `Book online ${svc?.patientLabel || "visit"}`);
  } else if (action === "confirm_online_book") {
    chatUserReply(messagesEl, "Yes, book online visit");
  } else if (action.startsWith("cancel_") && action !== "cancel_flow") {
    chatUserReply(messagesEl, "Cancel this appointment");
  } else if (action.startsWith("closest_") && action !== "closest_start") {
    const svc = getServiceById(action.replace("closest_", ""));
    chatUserReply(messagesEl, `Nearest ${svc?.patientLabel || "doctor"}`);
  }

  setTimeout(() => runChatAction(messagesEl, action, slotIndex), 350);
}

function runChatAction(messagesEl, action, slotIndex) {
  if (action.startsWith("closest_") && action !== "closest_start") {
    const serviceId = action.replace("closest_", "");
    if (FIXTURES.services.some((s) => s.id === serviceId)) {
      CHATBOT.state = "closest_service";
      showClosestMatch(messagesEl, serviceId);
      return;
    }
  }

  if (action === "help") {
    chatBotReply(messagesEl, "I can:\n• Book by service (cardio, general doctor, skin care)\n• Call a doctor directly by specialty\n• Find the closest practitioner with an open slot\n• If no in-person slots: call your doctor or book an online video visit\n• Show or cancel your upcoming visits\n\nTry \"call a doctor\" or open the Call tab.", {
      quickReplies: [
        { id: "book_start", label: "Book appointment" },
        { id: "call_doctor_start", label: "Call a doctor" },
        { id: "closest_start", label: "Nearest doctor" },
      ],
    });
    return;
  }

  if (action === "call_doctor_start") {
    showCallDoctorPicker(messagesEl);
    return;
  }

  if (action.startsWith("call_pick_")) {
    showCallProvidersForService(messagesEl, action.replace("call_pick_", ""));
    return;
  }

  if (action.startsWith("call_provider_")) {
    const providerId = action.replace("call_provider_", "");
    const provider = getProviderById(providerId);
    if (provider && initiateDoctorCall(provider)) {
      chatBotReply(messagesEl, `Opening phone dialer for ${provider.name} (${formatPhoneDisplay(provider.phone)}).`, {
        quickReplies: [
          { id: "book_start", label: "Book a visit" },
          { id: "call_doctor_start", label: "Call another doctor" },
        ],
      });
    } else {
      chatBotReply(messagesEl, "Sorry, we couldn't connect that call.", {
        quickReplies: [{ id: "call_doctor_start", label: "Try again" }],
      });
    }
    return;
  }

  if (action === "book_start") {
    CHATBOT.state = "pick_service";
    chatBotReply(messagesEl, "What type of care do you need?", { quickReplies: serviceQuickReplies() });
    return;
  }

  if (action === "closest_start") {
    CHATBOT.state = "closest_service";
    chatBotReply(messagesEl, "Which service should I search near you?", { quickReplies: serviceQuickReplies() });
    return;
  }

  if (action.startsWith("service_")) {
    const serviceId = action.replace("service_", "");
    if (CHATBOT.state === "closest_service") showClosestMatch(messagesEl, serviceId);
    else showAvailabilityForService(messagesEl, serviceId);
    return;
  }

  if (action.startsWith("book_slot_")) {
    const idx = slotIndex ?? Number(action.replace("book_slot_", ""));
    const slot = (CHATBOT.lastSlots || [])[idx];
    if (!slot) {
      chatBotReply(messagesEl, "That slot is no longer available.", {
        quickReplies: [{ id: "book_start", label: "Search again" }],
      });
      return;
    }
    CHATBOT.pendingSlot = slot;
    CHATBOT.state = "confirm_book";
    chatBotReply(messagesEl, `Confirm booking?\n\n${slot.display}\n${slot.provider} · ${slot.type}\n${slot.location}${slot.distanceLabel ? `\n${slot.distanceLabel}` : ""}`, {
      quickReplies: [
        { id: "confirm_book", label: "Yes, book it" },
        { id: "book_start", label: "Pick another slot" },
      ],
    });
    return;
  }

  if (action === "confirm_book" && CHATBOT.pendingSlot) {
    completeChatBooking(messagesEl, CHATBOT.pendingSlot);
    return;
  }

  if (action.startsWith("call_doctor_")) {
    const serviceId = action.replace("call_doctor_", "");
    const provider = getPrimaryProviderForService(serviceId);
    if (provider && initiateDoctorCall(provider)) {
      chatBotReply(messagesEl, `Opening phone dialer for ${provider.name} (${formatPhoneDisplay(provider.phone)}).\n\nAfter your call, you can book an online visit here if needed.`, {
        quickReplies: getOnlineMeetings(serviceId).length
          ? [{ id: `online_meeting_${serviceId}`, label: "Book online meeting" }]
          : [{ id: "book_start", label: "Back to booking" }],
      });
    } else {
      chatBotReply(messagesEl, "Sorry, we couldn't find a phone number for this service.", {
        quickReplies: [{ id: `online_meeting_${serviceId}`, label: "Book online instead" }],
      });
    }
    return;
  }

  if (action.startsWith("online_meeting_")) {
    const serviceId = action.replace("online_meeting_", "");
    const service = getServiceById(serviceId);
    const onlineSlots = getOnlineMeetings(serviceId);
    CHATBOT.lastOnlineSlots = onlineSlots;
    CHATBOT.pendingServiceId = serviceId;
    CHATBOT.state = "pick_online_slot";

    if (!onlineSlots.length) {
      chatBotReply(messagesEl, `No online video visits available for ${service?.patientLabel || serviceId} right now.`, {
        quickReplies: serviceQuickReplies(),
      });
      return;
    }

    chatBotReply(messagesEl, `Online video visits for ${service.patientLabel}:`, {
      cards: onlineSlots.map((slot, i) => ({
        title: slot.display,
        subtitle: `${slot.provider} · ${slot.type}`,
        meta: slot.meetingId ? `Meeting ID: ${slot.meetingId}` : "Join from your phone or browser",
        action: `book_online_${i}`,
        actionLabel: "Book online visit",
        highlight: i === 0,
      })),
    });
    return;
  }

  if (action.startsWith("book_online_")) {
    const idx = slotIndex ?? Number(action.replace("book_online_", ""));
    const slot = (CHATBOT.lastOnlineSlots || [])[idx];
    if (!slot) {
      chatBotReply(messagesEl, "That online slot is no longer available.", {
        quickReplies: CHATBOT.pendingServiceId
          ? [{ id: `online_meeting_${CHATBOT.pendingServiceId}`, label: "See other times" }]
          : [{ id: "book_start", label: "Search again" }],
      });
      return;
    }
    CHATBOT.pendingOnlineSlot = slot;
    CHATBOT.state = "confirm_online_book";
    chatBotReply(messagesEl, `Confirm online video visit?\n\n${slot.display}\n${slot.provider} · ${slot.type}\n\nJoin link will be sent after booking.`, {
      quickReplies: [
        { id: "confirm_online_book", label: "Yes, book online" },
        { id: `online_meeting_${slot.serviceId}`, label: "Pick another time" },
      ],
    });
    return;
  }

  if (action === "confirm_online_book" && CHATBOT.pendingOnlineSlot) {
    completeOnlineBooking(messagesEl, CHATBOT.pendingOnlineSlot);
    return;
  }

  if (action === "my_appointments") {
    showMyAppointments(messagesEl);
    return;
  }

  if (action === "my_reminders") {
    showMyReminders(messagesEl);
    return;
  }

  if (action === "cancel_flow") {
    showCancelOptions(messagesEl);
    return;
  }

  if (action.startsWith("cancel_")) {
    cancelChatAppointment(messagesEl, action.replace("cancel_", ""));
  }
}

function showAvailabilityForService(messagesEl, serviceId) {
  CHATBOT.pendingServiceId = serviceId;
  CHATBOT.state = "pick_slot";
  const service = getServiceById(serviceId);
  const coords = getPatientCoords();
  const slots = searchAvailabilityByService(serviceId, {
    sortBy: "time",
    patientLat: coords.lat,
    patientLng: coords.lng,
  }).slice(0, 3);

  CHATBOT.lastSlots = slots;

  if (!slots.length) {
    showNoAvailabilityFallback(messagesEl, serviceId);
    return;
  }

  chatBotReply(messagesEl, `Next open slots for ${service.patientLabel}:`, {
    cards: slots.map((slot, i) => ({
      title: slot.display,
      subtitle: `${slot.provider} · ${slot.type}`,
      meta: `${slot.location}${slot.distanceLabel ? ` · ${slot.distanceLabel}` : ""}`,
      action: `book_slot_${i}`,
      actionLabel: "Book this slot",
    })),
    quickReplies: [{ id: `closest_${serviceId}`, label: "Show nearest instead" }],
  });
}

function showClosestMatch(messagesEl, serviceId) {
  const service = getServiceById(serviceId);
  const coords = getPatientCoords();
  const { practitioner, slot, alternatives } = findClosestPractitioner(serviceId, {
    patientLat: coords.lat,
    patientLng: coords.lng,
  });

  if (!practitioner || !slot) {
    showNoAvailabilityFallback(messagesEl, serviceId);
    return;
  }

  CHATBOT.lastSlots = [slot, ...alternatives];
  CHATBOT.pendingServiceId = serviceId;
  CHATBOT.state = "pick_slot";

  chatBotReply(messagesEl, `Closest match for ${service.patientLabel}:`, {
    cards: [{
      title: `${practitioner.name} · ${practitioner.specialty}`,
      subtitle: slot.display,
      meta: `${slot.location} · ${practitioner.distanceLabel || slot.distanceLabel || "near you"}`,
      action: "book_slot_0",
      actionLabel: "Book this slot",
    }],
  });

  if (alternatives.length) {
    CHATBOT.lastSlots = [slot, ...alternatives.slice(0, 2)];
    chatBotReply(messagesEl, `Say "show more slots" for ${alternatives.length} other nearby option${alternatives.length === 1 ? "" : "s"}.`);
  }
}

function showCallDoctorPicker(messagesEl) {
  CHATBOT.state = "call_doctor_pick";
  chatBotReply(messagesEl, "Which type of doctor would you like to call?", {
    quickReplies: (FIXTURES.services || []).map((s) => ({
      id: `call_pick_${s.id}`,
      label: s.patientLabel,
    })),
  });
}

function showCallProvidersForService(messagesEl, serviceId) {
  CHATBOT.state = "call_doctor_pick";
  CHATBOT.pendingServiceId = serviceId;
  const service = getServiceById(serviceId);
  const providers = getProvidersForService(serviceId);

  if (!providers.length) {
    chatBotReply(messagesEl, `No phone numbers on file for ${service?.patientLabel || "this service"}.`, {
      quickReplies: [{ id: "call_doctor_start", label: "Pick another specialty" }],
    });
    return;
  }

  chatBotReply(messagesEl, `Doctors you can call for ${service.patientLabel}:`, {
    cards: providers.map((p) => ({
      title: p.name,
      subtitle: p.specialty,
      meta: `${p.location} · ${formatPhoneDisplay(p.phone)}`,
      action: `call_provider_${p.id}`,
      actionLabel: "Call now",
    })),
  });
}

function showNoAvailabilityFallback(messagesEl, serviceId) {
  CHATBOT.pendingServiceId = serviceId;
  CHATBOT.state = "no_availability";
  const service = getServiceById(serviceId);
  const provider = getPrimaryProviderForService(serviceId);
  const onlineSlots = getOnlineMeetings(serviceId);

  let message = `No in-person appointments for ${service?.patientLabel || "this service"} right now.`;
  if (provider?.phone) {
    message += `\n\nYou can call ${provider.name} at ${formatPhoneDisplay(provider.phone)} or book an online video visit.`;
  } else if (onlineSlots.length) {
    message += "\n\nYou can book an online video visit instead.";
  } else {
    message += "\n\nTry another service or check back later.";
  }

  const quickReplies = [];
  if (provider?.phone) {
    const lastName = provider.name.split(" ").pop() || "doctor";
    quickReplies.push({ id: `call_doctor_${serviceId}`, label: `Call Dr. ${lastName}` });
  }
  if (onlineSlots.length) {
    quickReplies.push({ id: `online_meeting_${serviceId}`, label: "Book online meeting" });
  }
  quickReplies.push({ id: "book_start", label: "Try another service" });

  chatBotReply(messagesEl, message, { quickReplies });
}

function showMyReminders(messagesEl) {
  const upcoming = getAppointments().filter((a) => a.patientId === "P-1" && a.status === "scheduled");
  if (!upcoming.length) {
    chatBotReply(messagesEl, "No upcoming visits — no reminders scheduled.", {
      quickReplies: [{ id: "book_start", label: "Book appointment" }],
    });
    return;
  }
  const lines = upcoming.map((a) => {
    const st = getReminderStatus(a.id, a.status);
    const label = st === "sent" ? "Reminder sent ✓" : st === "scheduled" ? "Reminder scheduled (24h before)" : "No reminder";
    return `• ${a.displayDate} — ${label}`;
  });
  chatBotReply(messagesEl, `Your appointment reminders:\n\n${lines.join("\n")}`, {
    quickReplies: [{ id: "my_appointments", label: "View appointments" }],
  });
}

function showMyAppointments(messagesEl) {
  const appts = getAppointments().filter((a) => a.patientId === "P-1");
  const upcoming = appts.filter((a) => a.status === "scheduled");
  const past = appts.filter((a) => a.status === "completed").slice(0, 2);

  if (!upcoming.length && !past.length) {
    chatBotReply(messagesEl, "You have no appointments on file.", {
      quickReplies: [{ id: "book_start", label: "Book now" }],
    });
    return;
  }

  let text = "";
  if (upcoming.length) {
    text += "Upcoming:\n" + upcoming.map((a) => `• ${a.displayDate} — ${a.provider} (${a.type})`).join("\n");
  }
  if (past.length) {
    text += (text ? "\n\n" : "") + "Recent:\n" + past.map((a) => `• ${a.displayDate} — ${a.type}`).join("\n");
  }

  chatBotReply(messagesEl, text, {
    quickReplies: [
      { id: "book_start", label: "Book another" },
      ...(upcoming.length ? [{ id: "cancel_flow", label: "Cancel visit" }] : []),
    ],
  });
}

function showCancelOptions(messagesEl) {
  const upcoming = getAppointments().filter((a) => a.patientId === "P-1" && a.status === "scheduled");
  if (!upcoming.length) {
    chatBotReply(messagesEl, "You have no upcoming appointments to cancel.");
    return;
  }
  chatBotReply(messagesEl, "Which appointment should I cancel?", {
    quickReplies: upcoming.map((a) => ({
      id: `cancel_${a.id}`,
      label: `${a.displayDate.split("·")[0].trim()} · ${a.type}`,
    })),
  });
}

function cancelChatAppointment(messagesEl, id) {
  saveAppointments(getAppointments().map((a) =>
    String(a.id) === String(id) ? { ...a, status: "cancelled" } : a
  ));
  chatBotReply(messagesEl, "Done — your appointment is cancelled and the slot is released.", {
    quickReplies: [{ id: "book_start", label: "Book a new visit" }],
  });
  refreshMobilePanels();
}

function completeOnlineBooking(messagesEl, slot) {
  const session = getSession();
  const appt = {
    id: Date.now(),
    patient: session?.name || "Maria Santos",
    patientId: "P-1",
    provider: slot.provider,
    datetime: `${slot.date}T${slot.time}:00`,
    displayDate: slot.display,
    status: "scheduled",
    type: slot.type,
    location: "Online video visit",
    bookingChannel: "telehealth",
    meetingUrl: slot.meetingUrl,
    meetingId: slot.meetingId,
  };

  saveAppointments([...getAppointments(), appt]);
  sessionStorage.setItem("lastBooking", JSON.stringify({
    date: slot.date,
    time: slot.time,
    provider: slot.provider,
    serviceId: slot.serviceId,
    type: slot.type,
    telehealth: true,
    meetingUrl: slot.meetingUrl,
  }));

  queueConfirmation(appt);

  CHATBOT.pendingOnlineSlot = null;
  CHATBOT.state = "idle";

  chatBotReply(messagesEl, `You're booked for an online visit!\n\n${slot.display}\n${slot.provider} · ${slot.type}\n${slot.meetingUrl ? `\nJoin: ${slot.meetingUrl}` : ""}\n\nConfirmation email sent with your video link. Reminder scheduled 24 h before.`, {
    quickReplies: [
      { id: "my_appointments", label: "View appointments" },
      { id: "book_start", label: "Book another" },
    ],
  });

  refreshMobilePanels();
}

function completeChatBooking(messagesEl, slot) {
  const session = getSession();
  const appt = {
    id: Date.now(),
    patient: session?.name || "Maria Santos",
    patientId: "P-1",
    provider: slot.provider,
    datetime: `${slot.date}T${slot.time}:00`,
    displayDate: `${slot.display} ET`,
    status: "scheduled",
    type: slot.type,
    location: slot.location,
    bookingChannel: "mobile_chat",
  };

  saveAppointments([...getAppointments(), appt]);
  sessionStorage.setItem("lastBooking", JSON.stringify({
    date: slot.date,
    time: slot.time,
    provider: slot.provider,
    serviceId: slot.serviceId,
    type: slot.type,
  }));

  queueConfirmation(appt);

  CHATBOT.pendingSlot = null;
  CHATBOT.state = "idle";

  chatBotReply(messagesEl, `You're booked!\n\n${slot.display}\n${slot.provider} · ${slot.type}\n${slot.location}\n\nConfirmation email sent. Reminder scheduled 24 h before your visit.`, {
    quickReplies: [
      { id: "my_appointments", label: "View appointments" },
      { id: "book_start", label: "Book another" },
    ],
  });

  refreshMobilePanels();
}

function parseChatIntent(text) {
  const t = text.toLowerCase().trim();
  if (/^(hi|hello|hey)\b/.test(t)) return { action: "greet" };
  if (/^help\b|what can you/.test(t)) return { action: "help" };
  if (/book|schedule|appointment|see a doctor|new visit/.test(t)) return { action: "book_start" };
  if (/nearest|closest|near me|nearby/.test(t)) return { action: "closest_start" };
  if (/my appointment|upcoming|when is/.test(t)) return { action: "my_appointments" };
  if (/reminder|remind me|notification/.test(t)) return { action: "my_reminders" };
  if (/cancel/.test(t)) return { action: "cancel_flow" };
  if (/\bcall\b.*\b(doctor|dr)\b|\bphone\b.*\bdoctor\b|\bspeak to (a )?doctor\b|\bcall the clinic\b/.test(t)) return { action: "call_doctor_start" };
  if (/more slot|show more|other slot/.test(t)) return { action: "show_more" };
  if (/cardio|heart/.test(t)) {
    return { action: /nearest|closest|near/.test(t) ? `closest_cardiology` : "service_cardiology" };
  }
  if (/general|doctor|check.?up|primary/.test(t)) {
    return { action: /nearest|closest|near/.test(t) ? `closest_general` : "service_general" };
  }
  if (/skin|dermat|rash/.test(t)) {
    return { action: /nearest|closest|near/.test(t) ? `closest_dermatology` : "service_dermatology" };
  }
  if (/^(yes|confirm|book it)\b/.test(t) && CHATBOT.state === "confirm_book") return { action: "confirm_book" };
  if (/^(yes|confirm|book online|book it)\b/.test(t) && CHATBOT.state === "confirm_online_book") return { action: "confirm_online_book" };
  if (/\b(call|phone)\b/.test(t) && CHATBOT.pendingServiceId) return { action: `call_doctor_${CHATBOT.pendingServiceId}` };
  if (/\b(online|video|telehealth|virtual)\b/.test(t) && CHATBOT.pendingServiceId) return { action: `online_meeting_${CHATBOT.pendingServiceId}` };
  return null;
}

function handleChatInput(text) {
  const messagesEl = document.getElementById("chat-messages");
  if (!text.trim()) return;
  chatUserReply(messagesEl, text.trim());

  setTimeout(() => {
    const intent = parseChatIntent(text);
    if (intent?.action === "greet") {
      chatBotReply(messagesEl, `Hello ${chatFirstName()}! How can I help?`, {
        quickReplies: [
          { id: "book_start", label: "Book appointment" },
          { id: "call_doctor_start", label: "Call a doctor" },
          { id: "my_appointments", label: "My appointments" },
        ],
      });
      return;
    }
    if (intent?.action === "show_more" && CHATBOT.pendingServiceId) {
      const coords = getPatientCoords();
      const slots = searchAvailabilityByService(CHATBOT.pendingServiceId, {
        sortBy: "distance",
        patientLat: coords.lat,
        patientLng: coords.lng,
      }).slice(0, 3);
      CHATBOT.lastSlots = slots;
      if (slots.length) {
        chatBotReply(messagesEl, "Here are more options:", {
          cards: slots.map((slot, i) => ({
            title: slot.display,
            subtitle: `${slot.provider} · ${slot.type}`,
            meta: `${slot.location}${slot.distanceLabel ? ` · ${slot.distanceLabel}` : ""}`,
            action: `book_slot_${i}`,
            actionLabel: "Book",
          })),
        });
      } else {
        showNoAvailabilityFallback(messagesEl, CHATBOT.pendingServiceId);
      }
      return;
    }
    if (intent) {
      runChatAction(messagesEl, intent.action, null);
      return;
    }
    chatBotReply(messagesEl, "Try \"book general doctor\", \"call a doctor\", or \"my appointments\".", {
      quickReplies: [
        { id: "book_start", label: "Book appointment" },
        { id: "call_doctor_start", label: "Call a doctor" },
        { id: "my_appointments", label: "My appointments" },
      ],
    });
  }, 400);
}

function initChatbot() {
  const messagesEl = document.getElementById("chat-messages");
  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("chat-send");
  if (!messagesEl) return;

  messagesEl.innerHTML = "";
  chatWelcome(messagesEl);

  sendBtn?.addEventListener("click", () => {
    handleChatInput(input.value);
    input.value = "";
  });

  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatInput(input.value);
      input.value = "";
    }
  });
}

function refreshMobilePanels() {
  if (typeof refreshMobileHome === "function") refreshMobileHome();
  if (typeof refreshMobileAppointments === "function") refreshMobileAppointments();
}
