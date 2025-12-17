#!/bin/bash
set -euo pipefail

echo "🚀 Starting Security Operations Center..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ROOT_DIR}/logs"
PID_FILE="${ROOT_DIR}/.soc_dev.pid"

cd "${ROOT_DIR}"
mkdir -p "${LOG_DIR}"

if [ ! -d "${ROOT_DIR}/node_modules" ]; then
    echo "📦 Installing dependencies (first run)..."
    npm install
fi

wait_for_service() {
    local name="$1" check_cmd="$2" attempts=30 delay=2
    for ((i=1; i<=attempts; i++)); do
        if eval "${check_cmd}" >/dev/null 2>&1; then
            echo "✓ ${name} ready"
            return 0
        fi
        echo "⏳ Waiting for ${name} (${i}/${attempts})..."
        sleep "${delay}"
    done
    echo "✗ ${name} not reachable after $((attempts*delay))s" >&2
    return 1
}

ensure_service() {
    local name="$1" compose_name="$2" check_cmd="$3"
    if wait_for_service "${name}" "${check_cmd}"; then
        return 0
    fi

    if command -v docker-compose >/dev/null 2>&1; then
        echo "➡️  Starting ${name} via docker-compose..."
        docker-compose up -d "${compose_name}"
    elif command -v docker >/dev/null 2>&1; then
        echo "➡️  Starting ${name} via docker compose..."
        docker compose up -d "${compose_name}"
    else
        echo "✗ Docker not available to start ${name}" >&2
        return 1
    fi

    wait_for_service "${name}" "${check_cmd}"
}

pg_check_cmd="pg_isready -h localhost -p 5432"
if ! command -v pg_isready >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
        pg_check_cmd="docker-compose exec -T postgres pg_isready -U postgres"
    elif command -v docker >/dev/null 2>&1; then
        pg_check_cmd="docker compose exec -T postgres pg_isready -U postgres"
    fi
fi

redis_check_cmd="redis-cli -h localhost ping | grep -q PONG"
if ! command -v redis-cli >/dev/null 2>&1; then
    if command -v docker-compose >/dev/null 2>&1; then
        redis_check_cmd="docker-compose exec -T redis redis-cli ping | grep -q PONG"
    elif command -v docker >/dev/null 2>&1; then
        redis_check_cmd="docker compose exec -T redis redis-cli ping | grep -q PONG"
    fi
fi

ensure_service "PostgreSQL" "postgres" "${pg_check_cmd}"
ensure_service "Redis" "redis" "${redis_check_cmd}"

if [ -f "${PID_FILE}" ] && ps -p "$(cat "${PID_FILE}")" >/dev/null 2>&1; then
    echo "ℹ️  Existing SOC dev process detected (pid $(cat "${PID_FILE}")), stopping to avoid duplicates..."
    kill "$(cat "${PID_FILE}")" || true
    rm -f "${PID_FILE}"
fi

if ss -ltn sport = :3004 >/dev/null 2>&1; then
    echo "ℹ️  Port 3004 already in use; attempting to terminate owner..."
    PIDS_ON_PORT=$(ss -ltnp sport = :3004 2>/dev/null | awk -F'pid=' 'NR>1 {split($2,a,"[,)]"); print a[1]}' | tr '\n' ' ')
    if [ -n "${PIDS_ON_PORT}" ]; then
        echo "   Killing PIDs: ${PIDS_ON_PORT}"
        kill ${PIDS_ON_PORT} || true
    fi
fi

echo "⚙️  Initializing database and starting dev server..."
npm run dev > "${LOG_DIR}/dev.log" 2>&1 &
DEV_PID=$!
echo "${DEV_PID}" > "${PID_FILE}"

if ! wait_for_service "SOC API" "curl -fsS http://localhost:3004/health"; then
    echo "✗ SOC API failed to become healthy; see ${LOG_DIR}/dev.log" >&2
    exit 1
fi

echo "▶️  Running security demo to populate metrics..."
npm run demo

echo ""
echo "✅ SOC is running!"
echo "📊 Dashboard: http://localhost:3004/dashboard"
echo "📝 Logs: ${LOG_DIR}/dev.log"
echo ""
