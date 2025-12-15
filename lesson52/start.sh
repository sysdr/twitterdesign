#!/bin/bash

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"

echo "🚀 Starting Twitter DR System..."

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: Backend directory not found at $BACKEND_DIR"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

# Check for existing processes
if pgrep -f "node.*src/index.js" > /dev/null; then
    echo "⚠️  Backend already running, killing existing process..."
    pkill -f "node.*src/index.js"
    sleep 2
fi

if pgrep -f "react-scripts start" > /dev/null; then
    echo "⚠️  Frontend already running, killing existing process..."
    pkill -f "react-scripts start"
    sleep 2
fi

# Start backend
echo "▶️  Starting backend server..."
cd "$BACKEND_DIR" || exit 1
node src/index.js > "$PROJECT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
cd - > /dev/null || exit 1

# Wait for backend
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check $PROJECT_DIR/backend.log"
    exit 1
fi

# Start frontend
echo "▶️  Starting frontend dashboard..."
cd "$FRONTEND_DIR" || exit 1
PORT=3000 BROWSER=none npm start > "$PROJECT_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
cd - > /dev/null || exit 1

echo ""
echo "✅ System started!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Backend PID: $BACKEND_PID (log: $PROJECT_DIR/backend.log)"
echo "Frontend PID: $FRONTEND_PID (log: $PROJECT_DIR/frontend.log)"
echo ""
echo "Press Ctrl+C to stop..."

# Wait for processes
wait
