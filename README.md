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

## Quick start — run the prototype

```bash
./run-demo.sh
```

Or: `python3 prototype/server.py` · `npm start`

Opens **http://localhost:8080** in your browser automatically.

| URL | What |
|-----|------|
| http://localhost:8080 | Sign in — click a persona (no password) |
| http://localhost:8080/demo.html | Step-by-step client demo |
| http://localhost:8080/api/v1/health | Mock API health check |

See **[DEMO.md](DEMO.md)** for the full walkthrough · **[prototype/README.md](prototype/README.md)** for API details.

**Requirements:** Python 3.9+ only (no pip install).

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
