#!/bin/bash

echo "🚀 Starting Twitter Load Testing and Optimization Setup..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Start services
echo "🖥️ Starting backend server..."
npm run dev &
SERVER_PID=$!

echo "⚛️ Starting React development server..."
npx vite &
VITE_PID=$!

# Wait for services to start
sleep 5

echo "🧪 Running unit tests..."
npm test run

echo "🔄 Running integration tests..."
npm run test:integration

echo "📊 Running load tests..."
npm run test:load

echo "✅ Setup complete!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API Server: http://localhost:8000"
echo ""
echo "Services running:"
echo "- React App (PID: $VITE_PID)"
echo "- Backend Server (PID: $SERVER_PID)"
echo ""
echo "Run './stop.sh' to stop all services"

# Save PIDs for stop script
echo $SERVER_PID > .server.pid
echo $VITE_PID > .vite.pid

wait
