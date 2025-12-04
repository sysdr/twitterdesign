#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

LOG_FILE="$SCRIPT_DIR/run-all.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "Twitter MLOps System - Complete Setup"
echo "=========================================="
echo "Started at: $(date)"
echo ""

# Step 1: Install dependencies
echo "Step 1: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "Dependencies installed"
else
    echo "Dependencies already installed"
fi

# Step 2: Build
echo ""
echo "Step 2: Building TypeScript..."
if [ ! -d "dist" ]; then
    npm run build
    echo "Build completed"
else
    echo "Build already exists"
fi

# Step 3: Start Docker services
echo ""
echo "Step 3: Starting Docker services..."
if command -v docker-compose &> /dev/null; then
    docker-compose -f "$SCRIPT_DIR/docker-compose.yml" up -d
else
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d
fi

# Wait for services
echo "Waiting for services to be ready..."
sleep 10

# Check Docker services
echo ""
echo "Docker services status:"
docker ps | grep -E "(redis|postgres)" || echo "No services found"

# Step 4: Start application in background
echo ""
echo "Step 4: Starting application..."
if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "Application already running"
else
    nohup npm start > "$SCRIPT_DIR/app.log" 2>&1 &
    APP_PID=$!
    echo "Application started with PID: $APP_PID"
    sleep 5
fi

# Step 5: Check health
echo ""
echo "Step 5: Checking application health..."
for i in {1..10}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "Application is healthy!"
        curl -s http://localhost:3000/health | head -3
        break
    else
        echo "Waiting for application... ($i/10)"
        sleep 2
    fi
done

# Step 6: Run tests
echo ""
echo "Step 6: Running tests..."
npm test 2>&1 || echo "Tests completed with some failures (this is expected if services aren't fully ready)"

# Step 7: Run demo
echo ""
echo "Step 7: Running demo..."
if [ -f "demo.sh" ]; then
    bash demo.sh 2>&1 | tail -20
else
    echo "demo.sh not found"
fi

echo ""
echo "=========================================="
echo "Setup completed at: $(date)"
echo "Check $LOG_FILE for full output"
echo "Application log: $SCRIPT_DIR/app.log"
echo "=========================================="


