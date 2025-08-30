#!/bin/bash

echo "🚀 Starting Twitter Load Testing Services..."

# Start the backend server in the background
echo "🖥️ Starting backend server..."
node dist/server.js &
SERVER_PID=$!

# Wait for backend to start
sleep 3

# Start the frontend on the correct port
echo "⚛️ Starting React preview server..."
npx vite preview --host 0.0.0.0 --port 3000

# Keep the container running
wait $SERVER_PID
