# Team 06 — Medical Appointment Coordination

Full-clinic appointment coordination for **Our Clinic** (matches [Kaggle call dataset](https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset) branding).

**Stack (planned):** Django + DRF + PostgreSQL + React (TypeScript)

## Repository structure

```
team06-Medical-Appointment-Coordination/
├── data/
│   ├── kaggle/healthcare-appointment-booking-calls/2024/   # Call transcript JSON
│   └── scripts/import_kaggle_calls.py                      # Parse → fixtures
├── docs/PLAN.md
├── frontend/mockup/                                        # Clickable prototype
└── backend/                                                # Django API (Phase 1)
```

## Quick start — UI mockup

```bash
cd frontend/mockup
python3 -m http.server 8080
```

Open http://localhost:8080 → demo login → **Maria (Patient)**:

- **By service** — search Heart/Cardio, General Doctor, or Skin Care across 3 clinic sites
- **Closest to me** — find the nearest practitioner with an open slot (demo ZIP: 11201 Brooklyn)
- Sort results by earliest time or nearest distance

Front-desk: **Elena** → **Call log** to view parsed Kaggle transcripts.

## Kaggle dataset setup

1. Download the full dataset (optional; 5 sample calls are included):

```bash
kaggle datasets download -d ammarshafiq/healthcare-appointment-booking-calls-dataset \
  -p data/kaggle/healthcare-appointment-booking-calls --unzip
```

2. Regenerate fixtures after adding files to `2024/`:

```bash
python3 data/scripts/import_kaggle_calls.py
```

## Documentation

See [docs/PLAN.md](docs/PLAN.md) for user stories, architecture, and dataset mapping.
