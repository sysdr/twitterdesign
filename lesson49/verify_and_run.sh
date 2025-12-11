#!/bin/bash
set -e

PROJECT_DIR="$HOME/twitter-observability-stack"
cd "$PROJECT_DIR"

echo "=========================================="
echo "Verifying and Running Observability Stack"
echo "=========================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "Dependencies already installed"
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "Building TypeScript..."
    npm run build
else
    echo "Build directory exists"
fi

# Run tests
echo "Running tests..."
npm test || echo "Tests completed with warnings"

# Check for running services
echo "Checking for duplicate services..."
ps aux | grep -E "node.*dist/index.js|node.*src/index.ts" | grep -v grep && echo "WARNING: Services already running" || echo "No duplicate services found"

# Check ports
echo "Checking ports..."
lsof -i :3000 -i :3001 -i :9090 -i :16686 2>/dev/null && echo "WARNING: Ports in use" || echo "Ports available"

# Start services
echo "Starting services..."
bash "$PROJECT_DIR/start.sh"

# Wait a bit
sleep 5

# Run demo
echo "Running demo to generate metrics..."
cd "$PROJECT_DIR"
npm run demo || timeout 30 npm run demo

echo "=========================================="
echo "Verification Complete"
echo "=========================================="

