#!/bin/bash

echo "🛑 Stopping Twitter MVP CI/CD Demo"
echo "================================="

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

# Stop Docker containers
compose down

# Clean up volumes non-interactively
echo "🗑️ Cleaning up volumes and containers..."
compose down -v --remove-orphans

# Clean up node_modules and build artifacts
echo "🧹 Cleaning up build artifacts..."
find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".venv" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name ".cache" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.log" -type f -delete 2>/dev/null || true

# Clean up Docker system
echo "🐳 Cleaning up Docker system..."
docker system prune -f || true

echo "✅ System stopped and cleaned up"
