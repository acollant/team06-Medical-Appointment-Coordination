# UI Mockup (Phase 0)

Clickable HTML/CSS prototype for **Our Clinic**, aligned with the [Kaggle Healthcare Appointment Booking Calls](https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset) dataset (`2024/`).

## Run locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080 and use demo role buttons on the login page.

## Data pipeline

1. Call JSON files live in `data/kaggle/healthcare-appointment-booking-calls/2024/`
2. `data/scripts/import_kaggle_calls.py` parses transcripts → `js/kaggle-fixtures.js`
3. `fixtures.js` merges personas/appointments with Kaggle-derived services & availability

Re-run import after adding Kaggle files:

```bash
python3 ../../data/scripts/import_kaggle_calls.py
```

## Search by service (US-4.6)

**By service** tab — Heart/Cardio, General Doctor, Skin Care (IVR options [1][2][3] from call data).

**By provider** tab — specialty filter (legacy US-4.1).

## Call log (front-desk)

**Elena (Desk)** → **Call log** — browse parsed 2024 transcripts with intent/service filters.

## Screens

| Screen | Persona | Stories |
|--------|---------|---------|
| Patient search (service + provider) | P-1 | US-4.1, US-4.6 |
| Desk call log | P-3 | US-5.1 (phone channel) |
| Book / confirm | P-1 | US-4.2, US-7.1 |

See [docs/PLAN.md](../../docs/PLAN.md) for full specification.
