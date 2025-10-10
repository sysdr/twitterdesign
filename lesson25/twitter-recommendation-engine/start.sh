#!/bin/bash

echo "🚀 Starting Twitter Recommendation Engine..."

# Kill any existing processes
pkill -f "vite"

# Start development server
npm run dev &

echo "⏳ Waiting for server to start..."
sleep 5

echo ""
echo "✅ Recommendation Engine is running!"
echo "🌐 Dashboard: http://localhost:3000"
echo ""
echo "🎯 Features Available:"
echo "  • Real-time collaborative filtering"
echo "  • A/B testing framework"
echo "  • Engagement analytics"
echo "  • Interactive timeline"
echo ""
echo "📊 Open http://localhost:3000 to view the dashboard"
