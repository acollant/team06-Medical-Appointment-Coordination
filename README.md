# Team 06 — Medical Appointment Coordination

Full-clinic appointment coordination for **Our Clinic** — patients, providers, front-desk, and admin. Aligned with the [Kaggle Healthcare Appointment Booking Calls](https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset) dataset.

**Stack (planned):** Django + DRF + PostgreSQL + Redis/Celery + React (TypeScript)  
**Phase 0 (current):** Runnable HTML prototype + mock REST API

---

## Quick start

```bash
./run-demo.sh
```

Opens **http://localhost:8080** — click **Maria · Mobile app** for the chatbot, or any persona on the sign-in page. No install beyond Python 3.9+.

| URL | Purpose |
|-----|---------|
| [localhost:8080](http://localhost:8080) | Sign in & persona demo |
| [localhost:8080/demo.html](http://localhost:8080/demo.html) | Client demo script |
| [localhost:8080/patient/mobile.html](http://localhost:8080/patient/mobile.html) | Mobile patient app + chatbot |
| [localhost:8080/api/v1/health](http://localhost:8080/api/v1/health) | Mock API health check |

Full walkthrough: **[DEMO.md](DEMO.md)**

---

## Software engineering artifacts

All project documentation and deliverables. Start with **PLAN** and **ARCHITECTURE**, then use **DEMO** to run the prototype.

### Planning & requirements

| Artifact | Description |
|----------|-------------|
| [**docs/PLAN.md**](docs/PLAN.md) | Master plan — personas, user stories (US-1.x–US-7.x), NFRs, acceptance criteria, UI mockup spec, test datasets, implementation phases |
| [**DEMO.md**](DEMO.md) | Client demo guide — how to run the prototype, personas, 10-minute walkthrough |

### Architecture & design

| Artifact | Description |
|----------|-------------|
| [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) | Software architecture — layered design, domain model, booking/reminder flows, API surface, mobile chatbot, deployment, tech decisions |
| [docs/PLAN.md § UI Mockup Solution](docs/PLAN.md#ui-mockup-solution) | Screen inventory (SCR-01–SCR-17), wireframes, design tokens, navigation map |
| [docs/PLAN.md § Software Architecture](docs/PLAN.md#software-architecture) | Summary diagrams (also expanded in ARCHITECTURE.md) |

### Prototype & runnable demo

| Artifact | Description |
|----------|-------------|
| [**prototype/README.md**](prototype/README.md) | Runnable prototype server — UI + mock REST API, endpoints, requirements |
| [**frontend/mockup/README.md**](frontend/mockup/README.md) | HTML/CSS mockup — screens, data pipeline, demo walkthrough table |
| [`prototype/server.py`](prototype/server.py) | One-command server (`python3 prototype/server.py`) |
| [`run-demo.sh`](run-demo.sh) | Shell launcher (opens browser) |
| [`frontend/mockup/demo.html`](frontend/mockup/demo.html) | In-browser demo script (also served at `/demo.html`) |

### Data & datasets

| Artifact | Description |
|----------|-------------|
| [**data/kaggle/healthcare-appointment-booking-calls/README.md**](data/kaggle/healthcare-appointment-booking-calls/README.md) | Kaggle call dataset — schema, import instructions, field mapping |
| [`data/scripts/import_kaggle_calls.py`](data/scripts/import_kaggle_calls.py) | Parse `2024/*.json` → fixtures for mockup |
| [`data/demo/prototype-data.json`](data/demo/prototype-data.json) | Demo API data — locations, providers, availability, notifications |
| [`data/kaggle/.../derived/fixtures-bundle.json`](data/kaggle/healthcare-appointment-booking-calls/derived/fixtures-bundle.json) | Generated fixture bundle from Kaggle samples |

### Implementation (Phase 1+)

| Artifact | Description |
|----------|-------------|
| [**backend/README.md**](backend/README.md) | Planned Django apps, models (`NotificationLog`, `CallRecord`, …), API endpoints |
| `frontend/src/` | React SPA *(planned — not yet scaffolded)* |

### Key mockup source (Phase 0 code)

| Path | Role |
|------|------|
| [`frontend/mockup/js/fixtures.js`](frontend/mockup/js/fixtures.js) | Personas, appointments, merge layer |
| [`frontend/mockup/js/demo-fixtures.js`](frontend/mockup/js/demo-fixtures.js) | Multi-site locations, geo, availability slots |
| [`frontend/mockup/js/kaggle-fixtures.js`](frontend/mockup/js/kaggle-fixtures.js) | Kaggle call-dataset services & call records |
| [`frontend/mockup/js/search.js`](frontend/mockup/js/search.js) | Availability & closest-practitioner search |
| [`frontend/mockup/js/chatbot.js`](frontend/mockup/js/chatbot.js) | Mobile patient chatbot |
| [`frontend/mockup/js/reminders.js`](frontend/mockup/js/reminders.js) | T−24 h reminders & notification log |

---

## Repository layout

```
team06-Medical-Appointment-Coordination/
├── README.md                 ← you are here
├── DEMO.md                   ← client demo guide
├── docs/
│   ├── PLAN.md               ← user stories, NFRs, datasets
│   └── ARCHITECTURE.md       ← software architecture
├── prototype/
│   ├── README.md
│   └── server.py             ← run UI + mock API
├── frontend/mockup/          ← clickable Phase 0 prototype
├── backend/                  ← Django API (Phase 1)
├── data/
│   ├── demo/
│   ├── kaggle/
│   └── scripts/
└── run-demo.sh
```

---

## Features in the prototype

| Feature | User story | Where to try |
|---------|------------|--------------|
| Service availability search | US-4.6 | Patient → Book → By service |
| Closest practitioner | US-4.7 | Patient → Closest to me tab |
| Mobile chatbot booking | US-4.8 | **Maria · Mobile app** → Chat |
| Appointment reminders | US-7.2, US-4.4 | Appointments → Simulate 24h reminders |
| Front-desk call log | US-5.1 | Elena → Call log |
| Manual reminder send | US-5.5 | Elena → Check-in → Send reminder |

---

## Kaggle dataset (optional full download)

Five sample call transcripts are included. For the full dataset:

```bash
kaggle datasets download -d ammarshafiq/healthcare-appointment-booking-calls-dataset \
  -p data/kaggle/healthcare-appointment-booking-calls --unzip

python3 data/scripts/import_kaggle_calls.py
```

See [data/kaggle/healthcare-appointment-booking-calls/README.md](data/kaggle/healthcare-appointment-booking-calls/README.md).

---

## Team & license

Course project — Team 06. Kaggle call dataset: [PDDL license](https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset).
