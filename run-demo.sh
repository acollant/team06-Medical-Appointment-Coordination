#!/usr/bin/env bash
# Start the MedAppt Coord client demo (static HTML mockup)
cd "$(dirname "$0")/frontend/mockup" || exit 1
PORT="${1:-8080}"
echo ""
echo "  MedAppt Coord — Client Demo"
echo "  ---------------------------"
echo "  Open:  http://localhost:${PORT}"
echo "  Guide: http://localhost:${PORT}/demo.html"
echo ""
echo "  Press Ctrl+C to stop"
echo ""
python3 -m http.server "$PORT"
