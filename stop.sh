#!/bin/bash

echo "🛑 Stopping Twitter Geographic Distribution System..."

# Kill the Node.js server
echo "Stopping Node.js server..."
pkill -f "node server.js"

# Stop any React development servers
echo "Stopping React development servers..."
pkill -f "react-scripts start"

# Stop Docker containers if running
echo "Stopping Docker containers..."
docker-compose down 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Check if any processes are still running
if pgrep -f "node server.js" > /dev/null; then
    echo "Force killing remaining Node.js processes..."
    pkill -9 -f "node server.js"
fi

if pgrep -f "react-scripts" > /dev/null; then
    echo "Force killing remaining React processes..."
    pkill -9 -f "react-scripts"
fi

echo "✅ System stopped successfully"
