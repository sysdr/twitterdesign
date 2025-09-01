#!/bin/bash

set -e

echo "🚀 Starting Twitter MVP CI/CD Demo"
echo "=================================="

# Install dependencies
echo "📦 Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install --legacy-peer-deps && cd ..

# Build applications
echo "🏗️ Building applications..."
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    docker compose "$@"
  fi
}

# Start Docker environment
echo "🐳 Starting Docker environment..."
compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Run health checks
echo "🏥 Running health checks..."
./scripts/test/integration-test.sh

echo "✅ System is ready!"
echo ""
echo "🌐 Access points:"
echo "  - Load Balancer: http://localhost"
echo "  - Blue Environment: http://localhost:3001"
echo "  - Green Environment: http://localhost:3002"
echo "  - Monitoring (Grafana): http://localhost:3000"
echo "  - Metrics (Prometheus): http://localhost:9090"
echo ""
echo "🚀 Demo Blue-Green deployment:"
echo "  ./scripts/deploy/blue-green-deploy.sh blue"
echo "  ./scripts/deploy/blue-green-deploy.sh green"
