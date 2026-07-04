#!/usr/bin/env bash
# Start the MedAppt Coord runnable prototype (UI + mock API)
set -e
cd "$(dirname "$0")" || exit 1
PORT="${1:-8080}"
exec python3 prototype/server.py "$PORT"
