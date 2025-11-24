#!/bin/bash
echo "Starting Twitter Cache Optimization System..."

# Check if built
if [ ! -d "dist" ]; then
    echo "Building project first..."
    ./build.sh
fi

# Start in background
npm run dev &
SERVER_PID=$!

echo "✅ Server started (PID: $SERVER_PID)"
echo "📊 Dashboard: http://localhost:3000/index.html"
echo "📡 API: http://localhost:3000/api/cache/stats"
echo ""
echo "Press Ctrl+C to stop"

# Save PID for stop script
echo $SERVER_PID > .server.pid

# Wait for interrupt
wait $SERVER_PID

