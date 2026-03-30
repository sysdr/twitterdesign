#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

echo "[cleanup] stopping local node services..."
pkill -f "nexus-day-09/server.mjs" 2>/dev/null || true
pkill -f "node .*server.mjs" 2>/dev/null || true

echo "[cleanup] stopping/removing docker containers..."
if command -v docker >/dev/null 2>&1; then
  docker ps -q | xargs -r docker stop
  docker ps -aq | xargs -r docker rm
  docker system prune -af --volumes
else
  echo "[cleanup] docker not installed; skipped docker cleanup."
fi

echo "[cleanup] removing project artifacts..."
find "$ROOT" -type d -name node_modules -prune -exec rm -rf {} +
find "$ROOT" -type d -name venv -prune -exec rm -rf {} +
find "$ROOT" -type d -name .pytest_cache -prune -exec rm -rf {} +
find "$ROOT" -type f -name "*.pyc" -delete
find "$ROOT" -iname "*istio*" -exec rm -rf {} + 2>/dev/null || true

echo "[cleanup] done."
