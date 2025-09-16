#!/bin/bash

echo "🎬 Running Twitter Message Queue Demo..."
echo "======================================"

# Start the system
./start.sh

echo ""
echo "⏳ Waiting for services to be fully ready..."
sleep 10

echo ""
echo "🎯 Demo Instructions:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Publish some tweets using the form"
echo "3. Watch real-time metrics update in the dashboard"
echo "4. Open http://localhost:8080 to view Kafka cluster"
echo "5. Check the terminal for message processing logs"
echo ""
echo "🚀 Running automated load test in 30 seconds..."
sleep 30

echo "📊 Starting load test (10,000 messages)..."
node tests/load/load-test.js

echo ""
echo "✅ Demo completed! Check the dashboard for results."
echo "🛑 Press Ctrl+C to stop all services."

# Wait for user to stop
while true; do
    sleep 1
done
