#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Stopping Data Pipeline Operations System..."

if [ -f "$SCRIPT_DIR/.backend.pid" ]; then
  BACKEND_PID=$(cat "$SCRIPT_DIR/.backend.pid")
  if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
    echo "Stopping backend (PID: $BACKEND_PID)..."
    kill "$BACKEND_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
      kill -9 "$BACKEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$SCRIPT_DIR/.backend.pid"
fi

if [ -f "$SCRIPT_DIR/.frontend.pid" ]; then
  FRONTEND_PID=$(cat "$SCRIPT_DIR/.frontend.pid")
  if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
    echo "Stopping frontend (PID: $FRONTEND_PID)..."
    kill "$FRONTEND_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still running
    if ps -p "$FRONTEND_PID" > /dev/null 2>&1; then
      kill -9 "$FRONTEND_PID" 2>/dev/null || true
    fi
  fi
  rm -f "$SCRIPT_DIR/.frontend.pid"
fi

# Kill any remaining Node processes on these ports
echo "Cleaning up ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo "✅ System stopped"
