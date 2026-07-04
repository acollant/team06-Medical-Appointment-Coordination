# Backend (Phase 1)

Django + DRF API. See [docs/PLAN.md](../docs/PLAN.md) and [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Planned models (Kaggle-aligned)

| Model | Source |
|-------|--------|
| `CallRecord` | Kaggle JSON: jobName, transcript, intent, serviceId, ivrOptions, bookingChannel |
| `Service` | Derived: cardiology, general, dermatology + `ivr_option` |
| `Location` | Multi-site clinics with lat/lng for distance search |
| `Provider` | Specialty, location FK, lat/lng, **phone**, **`telehealth_enabled`** |
| `PatientProfile` | Saved address/ZIP with geocoded coordinates |
| `Slot` | **`modality`:** `in_person \| telehealth`; status lifecycle |
| `Appointment` | Includes `booking_channel`, `source_call_id`, **`meeting_url`**, **`meeting_id`** (telehealth) |
| `NotificationLog` | Confirmation + T−24 h reminder delivery audit |

## Planned availability APIs

| Endpoint | Story | Description |
|----------|-------|-------------|
| `GET /api/v1/availability?service=&location=&sort=time\|distance` | US-4.6 | Open **in-person** slots for a clinical service |
| `GET /api/v1/availability/closest?service=&lat=&lng=` | US-4.7 | Nearest practitioner with next open in-person slot |
| `GET /api/v1/availability/online?service=` | US-4.9 | Telehealth / video visit slots when in-person is full |
| `GET /api/v1/providers?specialty=&location=` | US-4.1 | Provider search with optional distance; includes phone for call fallback |

## Planned notification APIs

| Endpoint | Story | Description |
|----------|-------|-------------|
| `GET /api/v1/notifications?appointment=` | US-4.4 | List confirmation/reminder log for appointment |
| `POST /api/v1/notifications/reminder` | US-5.5 | Front desk manual reminder (1 h cooldown) |
| Celery beat job | US-7.2 | T−24 h reminder batch (idempotent) |

Telehealth confirmations (US-7.1) include `meeting_url` in the email body when `booking_channel=telehealth`.

## Telehealth service (US-4.9)

```python
# backend/apps/scheduling/telehealth.py (planned)

class TelehealthService:
    def get_primary_provider(self, service_id: str) -> ProviderProfile: ...
    def find_online_slots(self, service_id: str) -> QuerySet[Slot]: ...
    def provision_meeting_url(self, appointment_id: int) -> str: ...
```

Implemented in Phase 0 prototype: `frontend/mockup/js/telehealth.js` + `chatbot.js` (client-side fallback when in-person slots are empty).

Reminder and notification prototype: `prototype/server.py` + `frontend/mockup/js/reminders.js`.

## Seed data

```bash
python3 data/scripts/import_kaggle_calls.py
# Demo: frontend/mockup/js/demo-fixtures.js (includes onlineMeetingsByService), js/telehealth.js
# Future: python manage.py seed_from_kaggle --dir data/kaggle/.../2024
```

**Demo scenario:** Skin Care (dermatology) has no in-person slots — matches Kaggle call 005; telehealth slots for Dr. Lisa Wong are seeded in `onlineMeetingsByService`.
