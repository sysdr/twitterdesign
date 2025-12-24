#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Data Pipeline Operations System..."

# Verify directories exist
if [ ! -d "backend" ]; then
  echo "❌ Error: backend directory not found"
  exit 1
fi

if [ ! -d "frontend" ]; then
  echo "❌ Error: frontend directory not found"
  exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
if [ -f "package.json" ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Error: Backend dependencies installation failed"
    exit 1
  fi
else
  echo "❌ Error: backend/package.json not found"
  exit 1
fi

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend"
if [ -f "package.json" ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo "❌ Error: Frontend dependencies installation failed"
    exit 1
  fi
else
  echo "❌ Error: frontend/package.json not found"
  exit 1
fi

cd "$SCRIPT_DIR"
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "  ./start.sh    - Start all services"
echo "  ./stop.sh     - Stop all services"
