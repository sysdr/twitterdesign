#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Starting Observability Stack"
echo "=========================================="

# Check for duplicate services
echo "Checking for duplicate services..."
if pgrep -f "node.*dist/index.js" > /dev/null || pgrep -f "node.*src/index.ts" > /dev/null; then
    echo "WARNING: Application service already running!"
    echo "Stopping existing services..."
    pkill -f "node.*dist/index.js" || true
    pkill -f "node.*src/index.ts" || true
    sleep 2
fi

# Check if Docker containers are already running
if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "WARNING: Docker containers already running!"
    echo "Stopping existing containers..."
    docker-compose down
    sleep 2
fi

echo "Starting services with Docker Compose..."
docker-compose up -d

echo "Waiting for services to be ready..."
sleep 10

# Check if dist directory exists, if not build
if [ ! -d "dist" ]; then
    echo "Building application..."
    npm run build
fi

echo "Starting application..."
cd "$SCRIPT_DIR"
npm start &

echo ""
echo "Services started successfully!"
echo "- Jaeger UI: http://localhost:16686"
echo "- Prometheus: http://localhost:9090"
echo "- Grafana: http://localhost:3001 (admin/admin)"
echo "- Application: http://localhost:3000"
echo "- Metrics: http://localhost:3000/metrics"
echo ""
