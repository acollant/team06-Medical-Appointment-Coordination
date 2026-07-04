/**
 * App fixtures — personas and UI state.
 * Clinical services, providers, availability, and call records come from
 * Kaggle Healthcare Appointment Booking Calls (2024/) via kaggle-fixtures.js
 */
const FIXTURES = {
  personas: {
    "P-1": {
      id: "P-1",
      email: "maria.santos@example.com",
      name: "Maria Santos",
      role: "Patient",
      dashboard: "patient/dashboard.html",
    },
    "P-2": {
      id: "P-2",
      email: "dr.chen@clinic.com",
      name: "Dr. James Chen",
      role: "Provider",
      specialty: "Cardiology",
      dashboard: "provider/calendar.html",
    },
    "P-3": {
      id: "P-3",
      email: "elena.ruiz@clinic.com",
      name: "Elena Ruiz",
      role: "FrontDesk",
      dashboard: "desk/schedule.html",
    },
    "P-4": {
      id: "P-4",
      email: "david.okonkwo@clinic.com",
      name: "David Okonkwo",
      role: "Admin",
      dashboard: "admin/clinic.html",
    },
  },
  appointmentTypes: [
    { id: 1, name: "Cardiology Follow-up", duration: 15, prep: "Bring prior lab results" },
    { id: 2, name: "New Patient Consult", duration: 30, prep: "Arrive 15 min early" },
    { id: 3, name: "General Visit", duration: 20, prep: "Bring insurance card" },
  ],
  slots: {
    "Dr. James Chen": {
      "2025-09-08": ["09:00", "09:15", "09:30", "10:00", "10:15", "10:30"],
      "2025-09-09": ["09:00", "09:15", "11:00", "11:15", "14:00"],
    },
    "Dr. Amy Patel": {
      "2025-09-08": ["11:00", "11:30", "14:00", "14:30"],
      "2025-09-12": ["09:30", "10:00"],
    },
    "Dr. Robert Kim": {
      "2025-09-09": ["15:00", "15:30", "16:00"],
    },
    "Dr. Sarah Lee": {
      "2025-09-10": ["14:30", "15:00", "15:30"],
      "2025-09-11": ["11:00", "11:30"],
    },
    "Dr. Lisa Wong": {
      "2025-09-11": ["10:00", "10:30"],
      "2025-09-12": ["15:00", "15:30"],
      "2025-09-15": ["09:15", "09:45"],
    },
    "Dr. Michael Rivera": {
      "2025-09-12": ["09:30", "10:00", "11:00"],
    },
  },
  appointments: [
    {
      id: 101,
      patient: "Maria Santos",
      patientId: "P-1",
      provider: "Dr. James Chen",
      datetime: "2025-09-10T10:00:00",
      displayDate: "Wed Sep 10 · 10:00 AM ET",
      status: "scheduled",
      type: "Cardiology Follow-up",
      location: "Our Clinic",
      bookingChannel: "phone",
      sourceCallId: "our-clinic-2024-call-001",
    },
    {
      id: 102,
      patient: "John Doe",
      patientId: null,
      provider: "Dr. James Chen",
      datetime: "2025-09-10T14:00:00",
      displayDate: "Wed Sep 10 · 2:00 PM ET",
      status: "checked_in",
      type: "New Patient Consult",
      location: "Our Clinic",
      bookingChannel: "walk_in",
    },
    {
      id: 103,
      patient: "Maria Santos",
      patientId: "P-1",
      provider: "Dr. James Chen",
      datetime: "2025-08-12T10:00:00",
      displayDate: "Aug 12 · 10:00 AM ET",
      status: "completed",
      type: "Cardiology Follow-up",
      location: "Our Clinic",
      bookingChannel: "web",
    },
  ],
  deskSchedule: [
    { time: "9:00 AM", provider: "Dr. James Chen", patient: "Maria Santos", type: "Cardio follow-up", status: "scheduled", id: 101, channel: "phone" },
    { time: "9:30 AM", provider: "Dr. Sarah Lee", patient: "—", type: "—", status: "available", id: null, channel: null },
    { time: "10:00 AM", provider: "Dr. James Chen", patient: "John Doe", type: "New Patient", status: "checked_in", id: 102, channel: "walk_in" },
    { time: "11:00 AM", provider: "Dr. Amy Patel", patient: "—", type: "General", status: "available", id: null, channel: null },
  ],
  users: [
    { name: "Maria Santos", email: "maria.santos@example.com", role: "Patient", active: true },
    { name: "Dr. James Chen", email: "dr.chen@clinic.com", role: "Provider", active: true },
    { name: "Elena Ruiz", email: "elena.ruiz@clinic.com", role: "FrontDesk", active: true },
    { name: "David Okonkwo", email: "david.okonkwo@clinic.com", role: "Admin", active: true },
  ],
};

/** Merge Kaggle call-dataset fields (services, availability, callRecords, location, providers) */
function applyKaggleFixtures() {
  if (typeof KAGGLE_FIXTURES === "undefined") return;
  FIXTURES.dataset = KAGGLE_FIXTURES.dataset;
  FIXTURES.location = KAGGLE_FIXTURES.location;
  FIXTURES.services = KAGGLE_FIXTURES.services;
  FIXTURES.providers = KAGGLE_FIXTURES.providers;
  FIXTURES.availabilityByService = KAGGLE_FIXTURES.availabilityByService;
  FIXTURES.callRecords = KAGGLE_FIXTURES.callRecords;
  FIXTURES.specialties = [...new Set(KAGGLE_FIXTURES.providers.map((p) => p.specialty))];
}

/** Merge demo mock data — multi-site locations, geo, expanded availability (overrides Kaggle stubs) */
function applyDemoFixtures() {
  if (typeof DEMO_FIXTURES === "undefined") return;
  FIXTURES.patientProfile = DEMO_FIXTURES.patientProfile;
  FIXTURES.locations = DEMO_FIXTURES.locations;
  FIXTURES.providers = DEMO_FIXTURES.providers;
  FIXTURES.availabilityByService = DEMO_FIXTURES.availabilityByService;
  FIXTURES.specialties = [...new Set(DEMO_FIXTURES.providers.map((p) => p.specialty))];
}

applyKaggleFixtures();
applyDemoFixtures();
