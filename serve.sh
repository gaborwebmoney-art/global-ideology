#!/usr/bin/env bash
# Serve the game on your LAN so a phone on the same Wi-Fi can open it.  Usage: ./serve.sh [port]
set -euo pipefail
cd "$(dirname "$0")"
PORT="${1:-8765}"
IP="$( (hostname -I 2>/dev/null || true) | awk '{print $1}')"
echo "-----------------------------------------------------------"
echo " Game:  http://localhost:${PORT}/index.html   (this computer)"
[ -n "$IP" ] && echo " Phone: http://${IP}:${PORT}/index.html   (same Wi-Fi)"
echo " USB debugging instead (enables install + offline):"
echo "   adb reverse tcp:${PORT} tcp:${PORT}  then open http://localhost:${PORT}/index.html in phone Chrome"
echo " Ctrl+C to stop."
echo "-----------------------------------------------------------"
exec python3 -m http.server "${PORT}" --bind 0.0.0.0
