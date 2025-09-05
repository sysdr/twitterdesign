#!/bin/bash
set -e

echo "🚀 Starting Twitter Load Balancer Dashboard..."

# Check if build exists
if [ ! -d "dist" ]; then
    echo "⚠️ Application not built. Running build first..."
    ./build.sh
fi

# Start the application
echo "🌐 Starting development server on http://localhost:3000"
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 3

echo "✅ Load Balancer Dashboard is running!"
echo "📊 Open http://localhost:3000 to view the dashboard"
echo "🛑 Press Ctrl+C or run './stop.sh' to stop"

# Keep script running
wait $SERVER_PID
