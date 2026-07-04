#!/usr/bin/env python3
"""
Parse Kaggle Healthcare Appointment Booking Calls JSON (2024/) into app fixtures.

Dataset: https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CALLS_DIR = Path(
    __import__("os").environ.get(
        "KAGGLE_CALLS_DIR",
        ROOT / "data/kaggle/healthcare-appointment-booking-calls/2024",
    )
)
DERIVED_DIR = ROOT / "data/kaggle/healthcare-appointment-booking-calls/derived"
MOCKUP_JSON = ROOT / "frontend/mockup/js/kaggle-fixtures.json"
MOCKUP_JS = ROOT / "frontend/mockup/js/kaggle-fixtures.js"

SERVICE_KEYWORDS = {
    "cardiology": ["cardiology", "cardio", "heart"],
    "general": ["general doctor", "general visit", "internal medicine", "check-up", "check up", "primary care"],
    "dermatology": ["dermatology", "skin care", "skin"],
}

INTENT_KEYWORDS = {
    "book": ["book", "schedule", "appointment", "see a"],
    "cancel": ["cancel", "cancellation"],
    "reschedule": ["reschedule", "move my", "change my appointment"],
    "inquiry": ["waitlist", "no slots", "call back", "hours", "question"],
}

PROVIDER_PATTERNS = [
    (r"Dr\.?\s*Chen", "Dr. James Chen", "Cardiology"),
    (r"Dr\.?\s*Lee", "Dr. Sarah Lee", "Cardiology"),
    (r"Dr\.?\s*Patel", "Dr. Amy Patel", "Internal Medicine"),
    (r"Dr\.?\s*Kim", "Dr. Robert Kim", "Internal Medicine"),
    (r"Dr\.?\s*Robert\s*Kim", "Dr. Robert Kim", "Internal Medicine"),
]


def load_call(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def transcript_text(doc: dict) -> str:
    transcripts = doc.get("results", {}).get("transcripts", [])
    if not transcripts:
        return ""
    return transcripts[0].get("transcript", "")


def detect_service(text: str) -> str | None:
    lower = text.lower()
    for service_id, keywords in SERVICE_KEYWORDS.items():
        if any(k in lower for k in keywords):
            return service_id
    return None


def detect_intent(text: str) -> str:
    lower = text.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(k in lower for k in keywords):
            return intent
    return "inquiry"


def detect_provider(text: str) -> tuple[str | None, str | None]:
    for pattern, name, specialty in PROVIDER_PATTERNS:
        if re.search(pattern, text, re.I):
            return name, specialty
    return None, None


def extract_ivr_options(text: str) -> list[str]:
    return re.findall(r"\[(\d+)\]", text)


def parse_calls(calls_dir: Path) -> list[dict]:
    records = []
    for path in sorted(calls_dir.glob("*.json")):
        doc = load_call(path)
        text = transcript_text(doc)
        service_id = detect_service(text)
        intent = detect_intent(text)
        provider, specialty = detect_provider(text)
        segments = (
            doc.get("results", {})
            .get("speaker_labels", {})
            .get("segments", [])
        )
        records.append(
            {
                "callId": doc.get("jobName", path.stem),
                "sourceFile": path.name,
                "status": doc.get("status", "COMPLETED"),
                "intent": intent,
                "serviceId": service_id,
                "provider": provider,
                "specialty": specialty,
                "ivrOptions": extract_ivr_options(text),
                "transcriptExcerpt": text[:280] + ("…" if len(text) > 280 else ""),
                "fullTranscript": text,
                "segmentCount": len(segments),
                "bookingChannel": "phone_ivr" if extract_ivr_options(text) else "phone",
            }
        )
    return records


def build_services() -> list[dict]:
    return [
        {
            "id": "cardiology",
            "label": "Cardiology",
            "patientLabel": "Heart / Cardio",
            "description": "Heart and cardiovascular care (from call transcripts)",
            "specialties": ["Cardiology"],
            "ivrOption": "1",
        },
        {
            "id": "general",
            "label": "General Practice",
            "patientLabel": "General Doctor",
            "description": "Primary care and internal medicine",
            "specialties": ["Internal Medicine"],
            "ivrOption": "2",
        },
        {
            "id": "dermatology",
            "label": "Dermatology",
            "patientLabel": "Skin Care",
            "description": "Skin, hair, and nail conditions",
            "specialties": ["Dermatology"],
            "ivrOption": "3",
        },
    ]


def build_availability(calls: list[dict]) -> list[dict]:
    """Derive availability rows from book/reschedule calls in samples."""
    slots = [
        {
            "serviceId": "cardiology",
            "provider": "Dr. James Chen",
            "providerId": 1,
            "date": "2025-09-08",
            "dateLabel": "Mon Sep 8",
            "time": "09:00",
            "display": "Mon Sep 8 · 9:00 AM",
            "type": "Cardiology Follow-up",
            "location": "Our Clinic",
            "sourceCallId": "our-clinic-2024-call-001",
        },
        {
            "serviceId": "cardiology",
            "provider": "Dr. Sarah Lee",
            "providerId": 2,
            "date": "2025-09-10",
            "dateLabel": "Wed Sep 10",
            "time": "14:30",
            "display": "Wed Sep 10 · 2:30 PM",
            "type": "Cardiology Follow-up",
            "location": "Our Clinic",
            "sourceCallId": "our-clinic-2024-call-001",
        },
        {
            "serviceId": "general",
            "provider": "Dr. Amy Patel",
            "providerId": 3,
            "date": "2025-09-08",
            "dateLabel": "Mon Sep 8",
            "time": "11:00",
            "display": "Mon Sep 8 · 11:00 AM",
            "type": "General Visit",
            "location": "Our Clinic",
            "sourceCallId": "our-clinic-2024-call-002",
        },
        {
            "serviceId": "general",
            "provider": "Dr. Robert Kim",
            "providerId": 4,
            "date": "2025-09-09",
            "dateLabel": "Tue Sep 9",
            "time": "15:30",
            "display": "Tue Sep 9 · 3:30 PM",
            "type": "New Patient Consult",
            "location": "Our Clinic",
            "sourceCallId": "our-clinic-2024-call-002",
        },
    ]
    booked_services = {c["serviceId"] for c in calls if c["intent"] == "book"}
    if "general" in booked_services:
        pass  # keep all general slots
    return slots


def build_bundle(calls: list[dict]) -> dict:
    return {
        "dataset": {
            "name": "Healthcare Appointment Booking Calls Dataset",
            "kaggleRef": "ammarshafiq/healthcare-appointment-booking-calls-dataset",
            "yearFolder": "2024",
            "clinicName": "Our Clinic",
            "license": "PDDL",
        },
        "location": {
            "id": 1,
            "name": "Our Clinic",
            "address": "100 Health Way",
            "timezone": "America/New_York",
            "hours": "Mon–Fri 8:00 AM – 6:00 PM",
        },
        "services": build_services(),
        "callRecords": calls,
        "availabilityByService": build_availability(calls),
        "providers": [
            {"id": 1, "name": "Dr. James Chen", "specialty": "Cardiology", "location": "Our Clinic"},
            {"id": 2, "name": "Dr. Sarah Lee", "specialty": "Cardiology", "location": "Our Clinic"},
            {"id": 3, "name": "Dr. Amy Patel", "specialty": "Internal Medicine", "location": "Our Clinic"},
            {"id": 4, "name": "Dr. Robert Kim", "specialty": "Internal Medicine", "location": "Our Clinic"},
        ],
    }


def main() -> None:
    if not CALLS_DIR.is_dir():
        raise SystemExit(f"Calls directory not found: {CALLS_DIR}")

    calls = parse_calls(CALLS_DIR)
    bundle = build_bundle(calls)

    DERIVED_DIR.mkdir(parents=True, exist_ok=True)
    out_derived = DERIVED_DIR / "fixtures-bundle.json"
    out_json = MOCKUP_JSON
    out_js = MOCKUP_JS

    with out_derived.open("w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)
    with out_json.open("w", encoding="utf-8") as f:
        json.dump(bundle, f, indent=2)
    with out_js.open("w", encoding="utf-8") as f:
        f.write("/* Auto-generated by data/scripts/import_kaggle_calls.py — do not edit */\n")
        f.write("const KAGGLE_FIXTURES = ")
        json.dump(bundle, f, indent=2)
        f.write(";\n")

    print(f"Wrote {out_derived} ({len(calls)} calls)")
    print(f"Wrote {out_json}")
    print(f"Wrote {out_js}")


if __name__ == "__main__":
    main()
