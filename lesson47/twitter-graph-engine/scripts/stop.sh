#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "Stopping Graph Engine..."

# Stop backend (more specific pattern)
pkill -f "tsx watch.*$BACKEND_DIR.*server.ts" || pkill -f "tsx watch src/server.ts" || echo "No backend process found"

# Stop frontend (more specific pattern)
pkill -f "vite.*$FRONTEND_DIR" || pkill -f "vite" || echo "No frontend process found"

# Also kill by port if processes are still running
if lsof -i :3047 >/dev/null 2>&1; then
  echo "Killing process on port 3047..."
  lsof -ti :3047 | xargs kill -9 2>/dev/null || true
fi

if lsof -i :5173 >/dev/null 2>&1; then
  # Only kill if it's from this project
  VITE_PID=$(lsof -ti :5173)
  if [ ! -z "$VITE_PID" ]; then
    VITE_CMD=$(ps -p $VITE_PID -o cmd= 2>/dev/null || echo "")
    if echo "$VITE_CMD" | grep -q "$FRONTEND_DIR"; then
      echo "Killing frontend process on port 5173..."
      kill -9 $VITE_PID 2>/dev/null || true
    else
      echo "Port 5173 is in use by another project, not killing it"
    fi
  fi
fi

echo "Stopped!"
