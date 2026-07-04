# Client demo — Medical Appointment Coordination

Interactive HTML prototype for **Our Clinic** with sample appointments, phone call transcripts, and multi-site availability search.

## Run the prototype (30 seconds)

**One command** (opens your browser automatically):

```bash
./run-demo.sh
```

Alternatives:

```bash
python3 prototype/server.py
npm start
```

Then use:

| URL | Purpose |
|-----|---------|
| http://localhost:8080 | Sign in — click a persona button |
| http://localhost:8080/demo.html | Full client demo script (~10 min) |
| http://localhost:8080/api/v1/health | Mock REST API |

**Requirements:** Python 3.9+ only. No Node, database, or pip install needed.

## Quick client walkthrough

1. **Maria · Patient** → Book by service → General Doctor → sort **Nearest first**
2. **Closest to me** tab → Heart / Cardio → ZIP `11201` → Dr. James Chen highlighted
3. Sign out → **Elena · Front desk** → Today's schedule (11 rows) + Call log (5 transcripts)
4. Sign out → **David · Admin** → 3 locations, 6 providers, utilization reports

## What's in the demo data

| Item | Count |
|------|-------|
| Clinic locations (Brooklyn, Midtown, Queens) | 3 |
| Providers | 6 |
| Open availability slots | 12 |
| Phone/IVR call records (Kaggle 2024) | 5 |
| Today's desk schedule rows | 11 |
| Maria's appointments | 4 |

## Demo personas

| Button on login page | Role | Highlight |
|---------------------|------|-----------|
| Maria · Patient | Patient | Search, closest match, book |
| Elena · Front desk | FrontDesk | Schedule, call log, check-in |
| Dr. Chen · Provider | Provider | Calendar, mark complete |
| David · Admin | Admin | Locations, reports |

## Reset demo state

Refresh the browser, or clear site data for `localhost` in dev tools. Bookings/cancellations during a session persist in `localStorage` until refresh.

## More detail

- [frontend/mockup/demo.html](frontend/mockup/demo.html) — in-browser demo guide
- [frontend/mockup/README.md](frontend/mockup/README.md) — mockup technical notes
- [docs/PLAN.md](docs/PLAN.md) — full product plan
