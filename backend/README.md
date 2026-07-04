# Backend (Phase 1)

Django + DRF API. See [docs/PLAN.md](../docs/PLAN.md).

## Planned models (Kaggle-aligned)

| Model | Source |
|-------|--------|
| `CallRecord` | Kaggle JSON: jobName, transcript, intent, serviceId, ivrOptions, bookingChannel |
| `Service` | Derived: cardiology, general, dermatology + `ivr_option` |
| `Location` | Multi-site clinics with lat/lng for distance search |
| `Provider` | Specialty, location FK, lat/lng at practice site |
| `PatientProfile` | Saved address/ZIP with geocoded coordinates |
| `Appointment` | Includes `booking_channel` (phone, phone_ivr, web, walk_in), `source_call_id` |

## Planned availability APIs

| Endpoint | Story | Description |
|----------|-------|-------------|
| `GET /api/v1/availability?service=&location=&sort=time\|distance` | US-4.6 | Open slots for a clinical service |
| `GET /api/v1/availability/closest?service=&lat=&lng=` | US-4.7 | Nearest practitioner with next open slot |
| `GET /api/v1/providers?specialty=&location=` | US-4.1 | Provider search with optional distance |

## Seed data

```bash
python3 data/scripts/import_kaggle_calls.py
# Demo mock data: frontend/mockup/js/demo-fixtures.js (3 sites, 6 providers, 12 slots)
# Future: python manage.py seed_from_kaggle --dir data/kaggle/.../2024
```
