#!/usr/bin/env bash
set -euo pipefail

NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node.js 20+ required (found v${NODE_MAJOR})"
  exit 1
fi

node -e "if(typeof fetch!=='function') process.exit(1)" 2>/dev/null || {
  echo "ERROR: Built-in fetch not available — upgrade to Node.js 18+"
  exit 1
}

echo "✓ Node.js v$(node -e "process.stdout.write(process.versions.node)") ready"

CHECK_PORT="${PORT:-3190}"
if command -v ss &>/dev/null && ss -tln 2>/dev/null | grep -qE ":${CHECK_PORT}\\s"; then
  echo "WARN: port ${CHECK_PORT} is already in use. Use a free PORT=... npm start or stop the other listener."
elif command -v lsof &>/dev/null && lsof -iTCP:"${CHECK_PORT}" -sTCP:LISTEN &>/dev/null; then
  echo "WARN: port ${CHECK_PORT} is already in use. Use a free PORT=... npm start or stop the other listener."
fi

if [[ "${1:-}" == "--docker" ]]; then
  command -v docker &>/dev/null || { echo "ERROR: docker not found"; exit 1; }
  docker info &>/dev/null || { echo "ERROR: Docker daemon not running"; exit 1; }
  echo "Starting Ollama via Docker Compose..."
  docker compose up -d ollama
  echo "Waiting for Ollama to be healthy..."
  for i in $(seq 1 30); do
    wget -q -O- http://localhost:11434/api/tags &>/dev/null && { echo "✓ Ollama ready"; break; }
    sleep 2
    echo "  waiting... ($i/30)"
  done
  export NEXUS_MODE=ollama
  export NEXUS_URL=http://localhost:11434
fi

echo ""
echo "Next steps:"
echo "  npm run demo    # seed corpus + benchmark"
echo "  npm test        # full verification suite"
echo "  npm start       # web dashboard on :3190 (override: PORT=8080 npm start)"
