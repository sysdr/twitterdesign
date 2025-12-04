#!/bin/bash
# Verification script for MLOps setup

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "MLOps Setup Verification"
echo "=========================================="
echo ""

# Check files
echo "1. Checking generated files..."
FILES=(
    "package.json"
    "tsconfig.json"
    "jest.config.js"
    ".env"
    "docker-compose.yml"
    "src/index.ts"
    "src/model-registry.ts"
    "src/feature-store.ts"
    "src/model-serving.ts"
    "src/performance-monitor.ts"
    "src/retraining-pipeline.ts"
    "src/logger.ts"
    "tests/mlops.test.ts"
    "build.sh"
    "start.sh"
    "stop.sh"
    "demo.sh"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ✗ $file (MISSING)"
        MISSING=$((MISSING + 1))
    fi
done

if [ $MISSING -eq 0 ]; then
    echo "  All required files present!"
else
    echo "  WARNING: $MISSING files missing"
fi

echo ""
echo "2. Checking build artifacts..."
if [ -d "node_modules" ]; then
    echo "  ✓ node_modules exists"
else
    echo "  ✗ node_modules missing (run: npm install)"
fi

if [ -d "dist" ]; then
    echo "  ✓ dist exists"
else
    echo "  ✗ dist missing (run: npm run build)"
fi

echo ""
echo "3. Checking services..."
if docker ps | grep -q redis; then
    echo "  ✓ Redis running"
else
    echo "  ✗ Redis not running"
fi

if docker ps | grep -q postgres; then
    echo "  ✓ PostgreSQL running"
else
    echo "  ✗ PostgreSQL not running"
fi

if pgrep -f "node.*dist/index.js" > /dev/null; then
    echo "  ✓ Application running"
else
    echo "  ✗ Application not running"
fi

echo ""
echo "4. Checking ports..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "  ✓ Port 3000 in use"
else
    echo "  ✗ Port 3000 not in use"
fi

if lsof -i :6379 > /dev/null 2>&1; then
    echo "  ✓ Port 6379 in use (Redis)"
else
    echo "  ✗ Port 6379 not in use"
fi

if lsof -i :5432 > /dev/null 2>&1; then
    echo "  ✓ Port 5432 in use (PostgreSQL)"
else
    echo "  ✗ Port 5432 not in use"
fi

echo ""
echo "5. Testing API..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "  ✓ Health endpoint responding"
    curl -s http://localhost:3000/health | head -3
else
    echo "  ✗ Health endpoint not responding"
fi

echo ""
echo "=========================================="
echo "Verification complete"
echo "=========================================="


