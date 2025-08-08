#!/bin/bash

set -e

echo "🚀 Starting Twitter Real-Time System - Lesson 4 (Docker)"
echo "======================================================="

# Ensure docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose is not installed or not in PATH. Please install Docker Desktop."
  exit 1
fi

# Function to free a TCP port without killing Docker itself
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:${port} 2>/dev/null || true)
  if [ -n "$pids" ]; then
    for pid in $pids; do
      proc_name=$(ps -o comm= -p "$pid" 2>/dev/null || echo "")
      echo "🧹 Killing PID ${pid} (${proc_name}) using port ${port}"
      kill -9 "$pid" 2>/dev/null || true
    done
  fi
}

echo "🧹 Cleaning up any existing containers..."
docker-compose down || true

echo "🧹 Freeing ports if occupied (6379, 8000, 8001, 3000)"
for p in 6379 8000 8001 3000; do
  free_port "$p"
done

echo "📦 Starting services with Docker Compose..."
docker-compose up -d

echo "⏳ Waiting for backend to become available..."
ATTEMPTS=0
until curl -fsS http://localhost:8000/api/stats >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge 60 ]; then
    echo "❌ Backend did not become ready after 60 seconds. Check container logs with: docker-compose logs -f"
    exit 1
  fi
  sleep 1
done

echo "🎯 System started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend API: http://localhost:8000/api"
echo "📡 WebSocket: ws://localhost:8001"
echo ""
echo "💡 To stop the system, run: ./stop.sh"

echo "Press Ctrl+C to stop all services..."
trap 'echo "\nStopping..."; ./stop.sh; exit' INT
while true; do sleep 3600; done
