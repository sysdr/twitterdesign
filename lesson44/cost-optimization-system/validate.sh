#!/bin/bash

# Validation script for Cost Optimization System
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "Cost Optimization System - Validation"
echo "=========================================="
echo ""

# Check if required files exist
echo "1. Checking required files..."
files=(
  "package.json"
  "server/index.js"
  "src/components/Dashboard/CostDashboard.tsx"
  "src/App.tsx"
  "src/index.tsx"
  "index.html"
  "build.sh"
  "start.sh"
  "stop.sh"
)

missing_files=()
for file in "${files[@]}"; do
  if [ -f "$SCRIPT_DIR/$file" ]; then
    echo "   ✓ $file"
  else
    echo "   ✗ $file (MISSING)"
    missing_files+=("$file")
  fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
  echo ""
  echo "ERROR: Missing files detected!"
  exit 1
fi

echo ""
echo "2. Checking for duplicate services..."
backend_pids=$(ps aux | grep -E "node.*server/index.js" | grep -v grep | awk '{print $2}')
vite_pids=$(ps aux | grep -E "vite.*cost-optimization" | grep -v grep | awk '{print $2}')

if [ -n "$backend_pids" ]; then
  echo "   ⚠ Backend processes found: $backend_pids"
else
  echo "   ✓ No duplicate backend processes"
fi

if [ -n "$vite_pids" ]; then
  echo "   ⚠ Vite processes found: $vite_pids"
else
  echo "   ✓ No duplicate vite processes"
fi

echo ""
echo "3. Checking ports..."
if lsof -i :4000 >/dev/null 2>&1; then
  echo "   ⚠ Port 4000 is in use"
else
  echo "   ✓ Port 4000 is available"
fi

if lsof -i :3000 >/dev/null 2>&1; then
  echo "   ⚠ Port 3000 is in use"
else
  echo "   ✓ Port 3000 is available"
fi

echo ""
echo "4. Server code validation..."
# Check if server sends proper metrics
if grep -q "currentHourCost" "$SCRIPT_DIR/server/index.js"; then
  echo "   ✓ Server tracks currentHourCost"
else
  echo "   ✗ Server missing currentHourCost tracking"
fi

if grep -q "getProjectedDailyCost" "$SCRIPT_DIR/server/index.js"; then
  echo "   ✓ Server calculates projected daily cost"
else
  echo "   ✗ Server missing projected daily cost calculation"
fi

if grep -q "type: 'summary'" "$SCRIPT_DIR/server/index.js"; then
  echo "   ✓ Server sends summary metrics"
else
  echo "   ✗ Server missing summary metrics"
fi

echo ""
echo "5. Dashboard validation..."
if grep -q "currentHourCost" "$SCRIPT_DIR/src/components/Dashboard/CostDashboard.tsx"; then
  echo "   ✓ Dashboard uses currentHourCost from summary"
else
  echo "   ✗ Dashboard may not use aggregated metrics"
fi

echo ""
echo "=========================================="
echo "Validation Complete"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Install dependencies: npm install --legacy-peer-deps"
echo "  2. Run tests: npm test"
echo "  3. Start services: ./start.sh"
echo "  4. Run demo: npm run demo"
echo "  5. Open dashboard: http://localhost:3000"
echo ""


