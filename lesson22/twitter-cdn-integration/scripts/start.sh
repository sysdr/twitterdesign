#!/bin/bash
set -e

echo "🚀 Starting Twitter CDN Integration..."

# Start Redis if not running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "📦 Starting Redis..."
    redis-server --daemonize yes
fi

# Start the application
echo "🌐 Starting CDN services..."
npm run dev

echo "✅ CDN Integration started!"
echo "📊 Dashboard: http://localhost:3001"
echo "🔧 API: http://localhost:8000"
