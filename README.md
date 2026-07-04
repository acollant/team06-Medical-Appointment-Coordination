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

## Quick start — client demo

```bash
./run-demo.sh
# or: cd frontend/mockup && python3 -m http.server 8080
```

Open **http://localhost:8080** → click a persona → see **[DEMO.md](DEMO.md)** for the full client script.

| URL | What |
|-----|------|
| http://localhost:8080 | Sign in + persona buttons |
| http://localhost:8080/demo.html | Step-by-step demo guide |

**Maria (Patient):** search by service, closest practitioner, book a slot.  
**Elena (Desk):** today's schedule + phone call log.  
**David (Admin):** 3 locations, utilization reports.

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
