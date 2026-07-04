# Runnable prototype

One command starts the full interactive prototype — UI and mock REST API.

## Run

```bash
# From repo root (recommended)
./run-demo.sh

# Or directly
python3 prototype/server.py

# Custom port
python3 prototype/server.py 9000
```

Your browser opens automatically to the sign-in page.

## What you get

| URL | Description |
|-----|-------------|
| `/` | Sign in — click Maria, Elena, Dr. Chen, or David |
| `/demo.html` | Client demo script |
| `/api/v1/health` | API health check |
| `/api/v1/availability?service=general&sort=distance` | Open slots (US-4.6) |
| `/api/v1/availability/closest?service=cardiology&lat=40.6892&lng=-73.9857` | Closest practitioner (US-4.7) |

## Requirements

- Python 3.9+ (stdlib only — no pip install)

## Data

Mock data lives in `data/demo/prototype-data.json`. The UI also loads `frontend/mockup/js/demo-fixtures.js` for in-browser demos.
