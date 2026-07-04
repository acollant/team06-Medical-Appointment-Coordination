# Healthcare Appointment Booking Calls Dataset

Source: [Kaggle — ammarshafiq/healthcare-appointment-booking-calls-dataset](https://www.kaggle.com/datasets/ammarshafiq/healthcare-appointment-booking-calls-dataset) (PDDL license)

## What this dataset is

Transcribed **phone/IVR calls** to a generic clinic (**"Our Clinic"**). Each file is AWS Transcribe–style JSON with:

- `jobName`, `accountId`, `status` — job metadata
- `results.transcripts` — full call text (PII redacted)
- `results.speaker_labels.segments` — `spk_0` (receptionist/agent), `spk_1` (caller), start/end times
- `results.items` — word-level tokens with confidence scores
- IVR actions appear as `[1]`, `[2]`, etc. in the transcript

The Kaggle bundle includes a **`2024/`** folder with call JSON files for that year.

## Setup (full dataset)

1. Download from Kaggle (requires [Kaggle API credentials](https://www.kaggle.com/docs/api)):

```bash
kaggle datasets download -d ammarshafiq/healthcare-appointment-booking-calls-dataset -p data/kaggle/healthcare-appointment-booking-calls --unzip
```

2. Ensure JSON files are under `2024/` (or set `KAGGLE_CALLS_DIR`).

3. Regenerate app fixtures:

```bash
python3 data/scripts/import_kaggle_calls.py
```

Output: `derived/fixtures-bundle.json` — consumed by the HTML mockup and future Django seed command.

## Repo samples

This repo ships **5 representative sample transcripts** in `2024/` so the project works without downloading the full ~154 MB dataset. Replace or extend by adding real Kaggle files and re-running the import script.
