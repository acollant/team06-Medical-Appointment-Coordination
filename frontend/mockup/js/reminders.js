/** Appointment reminders & notification log (US-4.4, US-7.2, US-5.5) */

const NOTIF_LOG_KEY = "medappt_notification_log";
const REMINDER_COOLDOWN_KEY = "medappt_reminder_cooldown";

const DEFAULT_NOTIFICATIONS = [
  {
    id: "n-001",
    appointmentId: 101,
    type: "confirmation",
    channel: "email",
    status: "sent",
    recipient: "maria.santos@example.com",
    subject: "Appointment confirmed — Wed Sep 10 · 10:00 AM",
    sentAt: "2025-09-09T10:05:00",
    manual: false,
  },
  {
    id: "n-002",
    appointmentId: 101,
    type: "reminder",
    channel: "email",
    status: "scheduled",
    recipient: "maria.santos@example.com",
    subject: "Reminder: appointment tomorrow at 10:00 AM",
    scheduledAt: "2025-09-09T10:00:00",
    manual: false,
  },
  {
    id: "n-003",
    appointmentId: 104,
    type: "confirmation",
    channel: "email",
    status: "sent",
    recipient: "maria.santos@example.com",
    subject: "Appointment confirmed — Thu Sep 11 · Skin Consultation",
    sentAt: "2025-09-08T14:22:00",
    manual: false,
  },
  {
    id: "n-004",
    appointmentId: 104,
    type: "reminder",
    channel: "email",
    status: "scheduled",
    recipient: "maria.santos@example.com",
    subject: "Reminder: appointment tomorrow — Dr. Lisa Wong",
    scheduledAt: "2025-09-10T10:00:00",
    manual: false,
  },
];

function getNotificationLog() {
  try {
    const stored = localStorage.getItem(NOTIF_LOG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    /* fall through */
  }
  return [...DEFAULT_NOTIFICATIONS];
}

function saveNotificationLog(log) {
  localStorage.setItem(NOTIF_LOG_KEY, JSON.stringify(log));
}

function getReminderCooldowns() {
  try {
    return JSON.parse(localStorage.getItem(REMINDER_COOLDOWN_KEY) || "{}");
  } catch {
    return {};
  }
}

function setReminderCooldown(appointmentId) {
  const cd = getReminderCooldowns();
  cd[String(appointmentId)] = Date.now();
  localStorage.setItem(REMINDER_COOLDOWN_KEY, JSON.stringify(cd));
}

function isReminderOnCooldown(appointmentId, ms = 3600000) {
  const ts = getReminderCooldowns()[String(appointmentId)];
  return ts && Date.now() - ts < ms;
}

function getNotificationsForAppointment(appointmentId) {
  return getNotificationLog().filter((n) => String(n.appointmentId) === String(appointmentId));
}

function getReminderStatus(appointmentId, apptStatus) {
  if (apptStatus !== "scheduled") return "none";
  const logs = getNotificationsForAppointment(appointmentId);
  const sent = logs.find((n) => n.type === "reminder" && n.status === "sent");
  if (sent) return "sent";
  const scheduled = logs.find((n) => n.type === "reminder" && n.status === "scheduled");
  if (scheduled) return "scheduled";
  return "none";
}

function reminderBadge(appointmentId, apptStatus) {
  const status = getReminderStatus(appointmentId, apptStatus);
  if (status === "sent") return `<span class="badge badge-checked_in">Reminder sent</span>`;
  if (status === "scheduled") return `<span class="badge badge-scheduled">Reminder scheduled</span>`;
  return "";
}

function formatReminderTime(isoString) {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

function scheduleReminderForAppointment(appointment) {
  if (appointment.status !== "scheduled") return null;
  const log = getNotificationLog();
  const exists = log.some(
    (n) => String(n.appointmentId) === String(appointment.id) && n.type === "reminder"
  );
  if (exists) return null;

  const dt = new Date(appointment.datetime);
  const reminderAt = new Date(dt.getTime() - 24 * 60 * 60 * 1000);

  const entry = {
    id: `n-${Date.now()}`,
    appointmentId: appointment.id,
    type: "reminder",
    channel: "email",
    status: "scheduled",
    recipient: FIXTURES.patientProfile?.email || FIXTURES.personas?.["P-1"]?.email || "patient@example.com",
    subject: `Reminder: ${appointment.type} with ${appointment.provider}`,
    scheduledAt: reminderAt.toISOString(),
    manual: false,
  };

  log.push(entry);
  saveNotificationLog(log);
  return entry;
}

function queueConfirmation(appointment) {
  const log = getNotificationLog();
  log.push({
    id: `n-conf-${Date.now()}`,
    appointmentId: appointment.id,
    type: "confirmation",
    channel: "email",
    status: "sent",
    recipient: FIXTURES.patientProfile?.email || "maria.santos@example.com",
    subject: `Confirmed: ${appointment.displayDate || appointment.type}`,
    sentAt: new Date().toISOString(),
    manual: false,
  });
  saveNotificationLog(log);
  scheduleReminderForAppointment(appointment);
}

function sendReminder(appointmentId, options = {}) {
  const { manual = false, channel = "email" } = options;
  const appts = getAppointments();
  const appt = appts.find((a) => String(a.id) === String(appointmentId));
  if (!appt) return { ok: false, error: "Appointment not found" };
  if (appt.status !== "scheduled") return { ok: false, error: "Cannot remind — appointment not scheduled" };

  if (manual && isReminderOnCooldown(appointmentId)) {
    return { ok: false, error: "Cooldown — try again in 1 hour", code: 429 };
  }

  const log = getNotificationLog();
  const now = new Date().toISOString();
  const existing = log.find(
    (n) => String(n.appointmentId) === String(appointmentId) && n.type === "reminder" && n.status === "scheduled"
  );

  if (existing) {
    existing.status = "sent";
    existing.sentAt = now;
    existing.manual = manual;
    existing.channel = channel;
  } else {
    log.push({
      id: `n-rem-${Date.now()}`,
      appointmentId: appt.id,
      type: "reminder",
      channel,
      status: "sent",
      recipient: FIXTURES.patientProfile?.email || "maria.santos@example.com",
      subject: `Reminder: ${appt.type} — ${appt.displayDate}`,
      sentAt: now,
      manual,
    });
  }

  saveNotificationLog(log);
  if (manual) setReminderCooldown(appointmentId);

  const message = manual
    ? `Reminder email sent to ${appt.patient}`
    : `24h reminder sent for ${appt.displayDate}`;

  return { ok: true, message, appointment: appt };
}

/** Demo: process all due T-24h reminders */
function runDueReminders() {
  const appts = getAppointments().filter((a) => a.status === "scheduled");
  const log = getNotificationLog();
  let count = 0;

  for (const appt of appts) {
    const status = getReminderStatus(appt.id, appt.status);
    if (status !== "scheduled") continue;
    const scheduled = log.find(
      (n) => String(n.appointmentId) === String(appt.id) && n.type === "reminder" && n.status === "scheduled"
    );
    if (!scheduled) continue;
    // Demo: treat all scheduled reminders as "due" for client demo
    const result = sendReminder(appt.id, { manual: false, channel: "email" });
    if (result.ok) count += 1;
  }
  return count;
}

function showReminderToastForPatient(appt) {
  const status = getReminderStatus(appt.id, appt.status);
  if (status === "sent") {
    showToast(`Reminder: ${appt.displayDate} — ${appt.provider}`, "success");
  }
}

function renderNotificationList(container, appointmentId = null) {
  if (!container) return;
  let logs = getNotificationLog();
  if (appointmentId) logs = logs.filter((n) => String(n.appointmentId) === String(appointmentId));
  logs = logs.sort((a, b) => (b.sentAt || b.scheduledAt || "").localeCompare(a.sentAt || a.scheduledAt || ""));

  if (!logs.length) {
    container.innerHTML = `<div class="empty-state" style="padding:12px;">No notifications yet</div>`;
    return;
  }

  container.innerHTML = logs.map((n) => `<div class="card" style="margin-bottom:8px;">
    <strong>${n.type === "reminder" ? "Reminder" : "Confirmation"} · ${n.status}</strong>
    <p style="font-size:0.85rem;margin:4px 0;">${n.subject}</p>
    <p style="font-size:0.75rem;color:#64748b;">
      ${n.sentAt ? `Sent ${formatReminderTime(n.sentAt)}` : `Scheduled ${formatReminderTime(n.scheduledAt)}`}
      · ${n.channel}${n.manual ? " · manual" : ""}
    </p>
  </div>`).join("");
}
