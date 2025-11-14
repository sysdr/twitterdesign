#!/bin/bash

echo "=== Stopping Statistical Performance Optimizer ==="

# Try to get trial count from API before stopping
TRIAL_COUNT="N/A"
if command -v jq > /dev/null 2>&1; then
  # Use jq if available for reliable JSON parsing
  TRIAL_COUNT=$(curl -s http://localhost:3001/api/status 2>/dev/null | jq -r '.trialCount // "N/A"' 2>/dev/null || echo "N/A")
elif curl -s http://localhost:3001/api/status > /dev/null 2>&1; then
  # Fallback to grep if jq is not available
  TRIAL_COUNT=$(curl -s http://localhost:3001/api/status 2>/dev/null | grep -o '"trialCount":[0-9]*' | grep -o '[0-9]*' || echo "N/A")
fi

# Kill Node processes
pkill -f "tsx src/api/server.ts" || true
pkill -f "vite" || true
pkill -f "concurrently" || true
pkill -f "npm run dev" || true

echo "=== System Stopped ==="
if [ "$TRIAL_COUNT" != "N/A" ]; then
  echo "Trials completed: $TRIAL_COUNT / 30"
fi
