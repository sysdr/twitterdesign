#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Stopping Cost Optimization System..."

if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
  kill $(cat "$SCRIPT_DIR/.backend.pid") 2>/dev/null || true
  rm "$SCRIPT_DIR/.backend.pid"
  echo "✓ Backend stopped"
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
  kill $(cat "$SCRIPT_DIR/.frontend.pid") 2>/dev/null || true
  rm "$SCRIPT_DIR/.frontend.pid"
  echo "✓ Frontend stopped"
fi

# Kill any remaining processes
pkill -f "node.*server/index.js" 2>/dev/null || true
pkill -f "vite.*cost-optimization" 2>/dev/null || true

echo "✓ System stopped"
