#!/usr/bin/env python3
"""
MedAppt Coord runnable prototype — static UI + mock REST API.

Usage:
    python3 prototype/server.py
    python3 prototype/server.py 9000

Opens http://localhost:8080 (UI) and serves:
    GET /api/v1/health
    GET /api/v1/availability?service=&location=&sort=time|distance&lat=&lng=
    GET /api/v1/availability/closest?service=&lat=&lng=
"""
from __future__ import annotations

import json
import math
import socket
import sys
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
MOCKUP_DIR = ROOT / "frontend" / "mockup"
DATA_FILE = ROOT / "data" / "demo" / "prototype-data.json"

EARTH_RADIUS_KM = 6371


def load_data() -> dict:
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


DATA = load_data()
PROVIDERS_BY_ID = {p["id"]: p for p in DATA["providers"]}


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    rlat1, rlat2 = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(rlat1) * math.cos(rlat2) * math.sin(dlng / 2) ** 2
    return EARTH_RADIUS_KM * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def slot_coords(slot: dict) -> tuple[float | None, float | None]:
    provider = PROVIDERS_BY_ID.get(slot.get("providerId"))
    if provider:
        return provider.get("lat"), provider.get("lng")
    return None, None


def enrich_slot(slot: dict, lat: float | None, lng: float | None) -> dict:
    out = dict(slot)
    plat, plng = slot_coords(slot)
    if lat is not None and lng is not None and plat is not None and plng is not None:
        km = haversine_km(lat, lng, plat, plng)
        out["distanceKm"] = round(km, 2)
        out["distanceLabel"] = f"{int(km * 1000)} m away" if km < 1 else f"{km:.1f} km away"
    else:
        out["distanceKm"] = None
        out["distanceLabel"] = None
    return out


def search_availability(params: dict) -> list[dict]:
    service_id = params.get("service", [None])[0]
    location = params.get("location", [None])[0]
    sort_by = params.get("sort", ["time"])[0] or "time"
    lat = _float_param(params, "lat")
    lng = _float_param(params, "lng")

    if lat is None or lng is None:
        profile = DATA.get("patientProfile", {})
        lat = lat if lat is not None else profile.get("lat")
        lng = lng if lng is not None else profile.get("lng")

    results = list(DATA["availabilityByService"])
    if service_id:
        results = [s for s in results if s["serviceId"] == service_id]
    if location:
        results = [s for s in results if s["location"] == location]

    results = [enrich_slot(s, lat, lng) for s in results]

    if sort_by == "distance":
        results.sort(key=lambda s: (s.get("distanceKm") is None, s.get("distanceKm") or math.inf, s["date"], s["time"]))
    else:
        results.sort(key=lambda s: (s["date"], s["time"]))
    return results


def closest_practitioner(params: dict) -> dict:
    service_id = params.get("service", [None])[0]
    if not service_id:
        return {"error": "service query parameter required"}, 400

    lat = _float_param(params, "lat")
    lng = _float_param(params, "lng")
    profile = DATA.get("patientProfile", {})
    lat = lat if lat is not None else profile.get("lat")
    lng = lng if lng is not None else profile.get("lng")

    slots = search_availability({"service": [service_id], "sort": ["distance"], "lat": [str(lat)], "lng": [str(lng)]})
    if not slots:
        return {"practitioner": None, "slot": None, "alternatives": []}

    by_provider: dict[int, dict] = {}
    for slot in slots:
        pid = slot["providerId"]
        if pid not in by_provider:
            by_provider[pid] = slot

    ranked = sorted(
        by_provider.values(),
        key=lambda s: (s.get("distanceKm") is None, s.get("distanceKm") or math.inf, s["date"], s["time"]),
    )
    best = ranked[0]
    practitioner = dict(PROVIDERS_BY_ID[best["providerId"]])
    practitioner["distanceKm"] = best.get("distanceKm")
    practitioner["distanceLabel"] = best.get("distanceLabel")

    return {
        "practitioner": practitioner,
        "slot": best,
        "alternatives": ranked[1:],
    }


def _float_param(params: dict, key: str) -> float | None:
    raw = params.get(key, [None])[0]
    if raw is None or raw == "":
        return None
    try:
        return float(raw)
    except ValueError:
        return None


class PrototypeHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(MOCKUP_DIR), **kwargs)

    def log_message(self, fmt: str, *args) -> None:
        if self.path.startswith("/api/"):
            sys.stderr.write("[api] %s - %s\n" % (self.command, self.path))
        elif not self.path.endswith((".css", ".js", ".ico")):
            sys.stderr.write("[ui]  %s %s\n" % (self.command, self.path))

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/v1/"):
            self._handle_api(parsed, "GET")
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/api/v1/"):
            self._handle_api(parsed, "POST")
            return
        self._json_response({"error": "Method not allowed"}, 405)

    def _read_json_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length).decode("utf-8"))
        except json.JSONDecodeError:
            return {}

    def _handle_api(self, parsed, method: str = "GET") -> None:
        params = parse_qs(parsed.query)
        path = parsed.path.rstrip("/")
        body_in = self._read_json_body() if method == "POST" else {}

        if path == "/api/v1/health":
            body = {"status": "ok", "prototype": True, "clinic": "Our Clinic"}
        elif path == "/api/v1/availability/closest":
            result = closest_practitioner(params)
            if isinstance(result, tuple):
                body, code = result
                self._json_response(body, code)
                return
            body = result
        elif path == "/api/v1/availability":
            results = search_availability(params)
            body = {"results": results, "count": len(results)}
        elif path == "/api/v1/services":
            body = {"results": DATA["services"]}
        elif path == "/api/v1/providers":
            body = {"results": DATA["providers"]}
        elif path == "/api/v1/locations":
            body = {"results": DATA["locations"]}
        elif path == "/api/v1/notifications":
            appt_id = params.get("appointment", [None])[0]
            logs = DATA.get("notifications", [])
            if appt_id:
                logs = [n for n in logs if str(n.get("appointmentId")) == str(appt_id)]
            body = {"results": logs, "count": len(logs)}
        elif path == "/api/v1/notifications/reminder/run-due" and method == "POST":
            due = [n for n in DATA.get("notifications", []) if n.get("type") == "reminder" and n.get("status") == "scheduled"]
            for n in due:
                n["status"] = "sent"
                n["sentAt"] = "2025-09-09T12:00:00"
            body = {"processed": len(due), "message": f"Sent {len(due)} reminder(s)"}
        elif path == "/api/v1/notifications/reminder" and method == "POST":
            appt_id = body_in.get("appointmentId")
            manual = body_in.get("manual", True)
            if not appt_id:
                self._json_response({"error": "appointmentId required"}, 400)
                return
            entry = {
                "id": f"n-manual-{appt_id}",
                "appointmentId": appt_id,
                "type": "reminder",
                "channel": "email",
                "status": "sent",
                "recipient": DATA.get("patientProfile", {}).get("email", "patient@example.com"),
                "subject": f"Manual reminder for appointment {appt_id}",
                "sentAt": "2025-09-09T12:00:00",
                "manual": manual,
            }
            DATA.setdefault("notifications", []).append(entry)
            body = {"ok": True, "notification": entry}
        else:
            self._json_response({"error": "Not found"}, 404)
            return

        self._json_response(body)

    def _json_response(self, body: dict | list, status: int = 200) -> None:
        payload = json.dumps(body, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def pick_port(preferred: int) -> int:
    for port in [preferred] + list(range(preferred + 1, preferred + 20)):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    raise SystemExit(f"No free port near {preferred}")


def main() -> None:
    preferred = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    port = pick_port(preferred)
    url = f"http://localhost:{port}"

    print()
    print("  MedAppt Coord — Runnable Prototype")
    print("  ==================================")
    print(f"  UI:     {url}")
    print(f"  Guide:  {url}/demo.html")
    print(f"  API:    {url}/api/v1/health")
    print(f"  Reminders: POST {url}/api/v1/notifications/reminder/run-due")
    print()
    print("  Demo personas on the sign-in page — no password needed.")
    print("  Press Ctrl+C to stop.")
    print()

    webbrowser.open(url)

    server = ThreadingHTTPServer(("", port), PrototypeHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
        server.server_close()


if __name__ == "__main__":
    main()
