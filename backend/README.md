# Backend (Phase 1)

Django + DRF API. See [docs/PLAN.md](../docs/PLAN.md).

## Planned models (Kaggle-aligned)

| Model | Source |
|-------|--------|
| `CallRecord` | Kaggle JSON: jobName, transcript, intent, serviceId, ivrOptions, bookingChannel |
| `Service` | Derived: cardiology, general, dermatology + `ivr_option` |
| `Appointment` | Includes `booking_channel` (phone, phone_ivr, web, walk_in), `source_call_id` |

## Seed data

```bash
python3 data/scripts/import_kaggle_calls.py
# Future: python manage.py seed_from_kaggle --dir data/kaggle/.../2024
```
