/* Mobile patient chatbot — Our Clinic assistant (US-4.8) */

const CHATBOT = {
  state: "idle",
  pendingSlot: null,
  pendingServiceId: null,
  lastSlots: [],
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
        `<div class="chat-card">
          <strong>${escapeHtml(c.title)}</strong>
          <p>${escapeHtml(c.subtitle)}</p>
          ${c.meta ? `<p class="chat-card-meta">${escapeHtml(c.meta)}</p>` : ""}
          ${c.action ? `<button type="button" class="chat-card-btn" data-chat-action="${c.action}" data-slot-index="${i}">${escapeHtml(c.actionLabel || "Select")}</button>` : ""}
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
  chatBotReply(messagesEl, `Hi ${chatFirstName()}! I'm the Our Clinic assistant. I can help you book a visit, find the nearest doctor, or check your appointments.`, {
    quickReplies: [
      { id: "book_start", label: "Book appointment" },
      { id: "closest_start", label: "Nearest doctor" },
      { id: "my_appointments", label: "My appointments" },
      { id: "my_reminders", label: "My reminders" },
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
    confirm_book: "Yes, book it",
    cancel_flow: "Cancel an appointment",
  };

  if (labels[action]) chatUserReply(messagesEl, labels[action]);
  else if (action.startsWith("service_")) {
    chatUserReply(messagesEl, getServiceById(action.replace("service_", ""))?.patientLabel || action);
  } else if (action.startsWith("book_slot_")) {
    chatUserReply(messagesEl, "Book this slot");
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
    chatBotReply(messagesEl, "I can:\n• Book by service (cardio, general doctor, skin care)\n• Find the closest practitioner with an open slot\n• Show or cancel your upcoming visits\n\nTry typing \"book general doctor\" or tap a button.", {
      quickReplies: [
        { id: "book_start", label: "Book appointment" },
        { id: "closest_start", label: "Nearest doctor" },
      ],
    });
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
    chatBotReply(messagesEl, `No open slots for ${service?.patientLabel || serviceId}. Try another service?`, {
      quickReplies: serviceQuickReplies(),
    });
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
    chatBotReply(messagesEl, `No ${service?.patientLabel || ""} slots near you right now.`, {
      quickReplies: serviceQuickReplies(),
    });
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
      }
      return;
    }
    if (intent) {
      runChatAction(messagesEl, intent.action, null);
      return;
    }
    chatBotReply(messagesEl, "Try \"book general doctor\", \"nearest cardio\", or \"my appointments\".", {
      quickReplies: [
        { id: "book_start", label: "Book appointment" },
        { id: "closest_start", label: "Nearest doctor" },
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
