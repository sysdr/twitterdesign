#!/bin/bash

# Frontend Startup Script - Fixes dependencies and starts React dashboard

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/frontend"

echo "========================================="
echo "Frontend Dashboard Startup Script"
echo "========================================="
echo ""

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Error: Frontend directory not found at $FRONTEND_DIR"
    exit 1
fi

cd "$FRONTEND_DIR" || exit 1

# Check for existing frontend processes
if pgrep -f "react-scripts start" > /dev/null; then
    echo "⚠️  Frontend already running, stopping existing process..."
    pkill -f "react-scripts start"
    pkill -f "npm start"
    sleep 2
fi

# Check if dependencies are installed
if [ ! -d "node_modules/react-scripts" ]; then
    echo "📦 Dependencies not found. Installing..."
    echo "   This may take 2-5 minutes..."
    echo ""
    
    # Clean old dependencies
    rm -rf node_modules package-lock.json
    
    # Install dependencies
    npm install --legacy-peer-deps
    
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed. Please check the error above."
        exit 1
    fi
    
    echo ""
    echo "✅ Dependencies installed successfully!"
else
    echo "✅ Dependencies already installed"
fi

# Verify react-scripts is available
if [ ! -f "node_modules/.bin/react-scripts" ]; then
    echo "❌ Error: react-scripts not found after installation"
    exit 1
fi

echo ""
echo "🚀 Starting frontend development server..."
echo "   This may take 30-60 seconds to compile..."
echo ""

# Start frontend
PORT=3000 BROWSER=none npm start > /tmp/frontend_startup.log 2>&1 &
FRONTEND_PID=$!

echo "Frontend process started, PID: $FRONTEND_PID"
echo "Log file: /tmp/frontend_startup.log"
echo ""

# Wait for compilation
echo "⏳ Waiting for React to compile..."
for i in {1..12}; do
    sleep 5
    if ss -tlnp 2>/dev/null | grep -q 3000 || netstat -tlnp 2>/dev/null | grep -q 3000; then
        echo ""
        echo "✅ Frontend is running!"
        echo ""
        echo "📊 Dashboard URL: http://localhost:3000"
        echo ""
        echo "To stop the frontend, run: pkill -f 'react-scripts start'"
        exit 0
    fi
    echo -n "."
done

echo ""
echo "⚠️  Frontend is taking longer than expected to start."
echo "   Check the log: tail -f /tmp/frontend_startup.log"
echo "   Or check if port 3000 is listening: ss -tlnp | grep 3000"
echo ""
echo "Process PID: $FRONTEND_PID"
echo "Dashboard URL: http://localhost:3000"

