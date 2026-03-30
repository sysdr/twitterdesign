#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
PORT="${PORT:-3000}"

if ! command -v node >/dev/null 2>&1; then
  echo "[error] node not found; install Node.js 20+"
  exit 1
fi
NODE_MAJOR="$(node -e "process.stdout.write(process.versions.node.split('.')[0])")"
if [[ "${NODE_MAJOR}" -lt 20 ]]; then
  echo "[error] Node.js 20+ required (found v${NODE_MAJOR}.x)"
  exit 1
fi

for need in server.mjs engine.mjs; do
  if [[ ! -f "$ROOT/$need" ]]; then
    echo "[error] Missing $need in $ROOT"
    exit 1
  fi
done

port_in_use() {
  local p="$1"
  if command -v ss >/dev/null 2>&1 && ss -tln 2>/dev/null | grep -qE ":${p}([[:space:]]|$)"; then
    return 0
  fi
  if command -v lsof >/dev/null 2>&1 && lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi
  if (echo >/dev/tcp/127.0.0.1/"$p") >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

if port_in_use "$PORT"; then
  echo "[error] Port ${PORT} is already in use (another instance?)"
  ss -tlnp 2>/dev/null | grep -E ":${PORT}([[:space:]]|$)" || true
  exit 1
fi

exec node "$ROOT/server.mjs"
