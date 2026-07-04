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
3. `js/demo-fixtures.js` adds multi-site locations, geo coordinates, in-person slots, and **online telehealth slots** (`onlineMeetingsByService`)
4. `fixtures.js` merges personas/appointments with Kaggle + demo data
5. `js/telehealth.js` + `js/chatbot.js` implement mobile telehealth fallback (US-4.9)

Re-run import after adding Kaggle files:

```bash
python3 ../../data/scripts/import_kaggle_calls.py
```

## Demo walkthrough (Maria — Patient)

| Tab | What to try | Expected result |
|-----|-------------|-----------------|
| **By service** | Select General Doctor, sort Nearest first | 5 slots across Brooklyn, Queens |
| **By service** | Select Skin Care | No in-person slots — use **Maria · Mobile app** for telehealth fallback (US-4.9) |
| **Closest to me** | General Doctor, ZIP 11201 | Dr. Robert Kim · Brooklyn (~0.4 km) |
| **Closest to me** | Heart / Cardio, ZIP 11201 | Dr. James Chen · Brooklyn |
| **By provider** | Cardiology, All locations | Dr. Chen and Dr. Lee with distances |

## Search features

- **US-4.6** — By service tab: filter by location, sort by time or distance
- **US-4.7** — Closest to me tab: nearest practitioner with next open slot + alternatives
- **US-4.1** — By provider tab: specialty + location filter

## Mobile app (Maria · Mobile app)

- **US-4.8** — Chatbot: book by service, nearest doctor, list/cancel appointments, reminders
- **US-4.9** — When in-person slots are empty: **Call doctor** (`tel:`) or **Book online meeting** (video visit with join link)

Try: Book → **Skin Care** → Call Dr. Wong or Book online meeting → confirm.

## Call log (front-desk)

**Elena (Desk)** → **Call log** — browse parsed 2024 transcripts with intent/service filters.

## Screens

| Screen | Persona | Stories |
|--------|---------|---------|
| Patient search (service / closest / provider) | P-1 | US-4.1, US-4.6, US-4.7 |
| Patient mobile + chatbot | P-1 | US-4.8, US-4.9, US-4.6, US-4.7 |
| Desk call log | P-3 | US-5.1 (phone channel) |
| Book / confirm | P-1 | US-4.2, US-7.1 |

See [docs/PLAN.md](../../docs/PLAN.md) for full specification.
