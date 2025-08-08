#!/bin/bash

set -e

echo "🧼 Cleaning project: Twitter Real-Time System - Lesson 4"
echo "========================================================"

# Stop stack and remove compose resources
echo "🛑 Stopping services and removing compose resources..."
./stop.sh >/dev/null 2>&1 || true
docker-compose down -v --remove-orphans >/dev/null 2>&1 || true

# Free common ports
free_port() {
  local port=$1
  local pids
  pids=$(lsof -ti tcp:${port} 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "🧹 Freeing port ${port} (PIDs: $pids)"
    kill -9 $pids 2>/dev/null || true
  fi
}

echo "🔌 Freeing ports (6379, 8000, 8001, 3000)"
for p in 6379 8000 8001 3000; do free_port "$p"; done

# Remove project Docker images and volumes
echo "🧽 Removing project Docker images/volumes (if any)..."
PROJECT_IMG_IDS=$(docker images -q "twitter-realtime-lesson4-*" 2>/dev/null | sort -u || true)
if [ -n "$PROJECT_IMG_IDS" ]; then
  docker rmi -f $PROJECT_IMG_IDS >/dev/null 2>&1 || true
fi

PROJECT_VOLUMES=$(docker volume ls -q --filter name=twitter-realtime-lesson4 2>/dev/null || true)
if [ -n "$PROJECT_VOLUMES" ]; then
  docker volume rm -f $PROJECT_VOLUMES >/dev/null 2>&1 || true
fi

# Remove local dependencies/build artifacts
echo "🗑️  Removing local node_modules and build outputs..."
rm -rf backend/node_modules frontend/node_modules backend/dist .backend.pid .frontend.pid 2>/dev/null || true

echo "✅ Cleanup complete. You can start fresh with: ./start.sh"


