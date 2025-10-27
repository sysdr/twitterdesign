#!/bin/bash
set -e

echo "🚀 Starting Twitter Search Infrastructure"

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo "📂 Project root: $PROJECT_ROOT"

# Check for duplicate services
echo "🔍 Checking for existing services..."
EXISTING_BACKEND=$(pgrep -f "node.*dist/server.js" || true)
EXISTING_FRONTEND=$(pgrep -f "react-scripts" || true)

if [ ! -z "$EXISTING_BACKEND" ]; then
  echo "⚠️  Backend service already running (PID: $EXISTING_BACKEND)"
  read -p "Kill existing backend? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $EXISTING_BACKEND
    echo "✅ Killed existing backend"
  fi
fi

if [ ! -z "$EXISTING_FRONTEND" ]; then
  echo "⚠️  Frontend service already running (PID: $EXISTING_FRONTEND)"
  read -p "Kill existing frontend? (y/n): " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    kill $EXISTING_FRONTEND
    echo "✅ Killed existing frontend"
  fi
fi

# Start Docker services
echo "🐳 Starting Docker services..."
cd "$PROJECT_ROOT/docker"
docker-compose up -d

# Wait for Elasticsearch
echo "⏳ Waiting for Elasticsearch to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:9200/_cluster/health > /dev/null 2>&1; then
    echo "✅ Elasticsearch is ready!"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done

# Start backend
echo "🔧 Starting backend..."
cd "$PROJECT_ROOT/backend"

# Check if node_modules exists, if not, install
if [ ! -d "node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  npm install
fi

# Check if dist folder exists, if not, build
if [ ! -d "dist" ]; then
  echo "🔨 Building backend..."
  npm run build
fi

npm start > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend
sleep 5

# Start frontend
echo "⚛️  Starting frontend..."
cd "$PROJECT_ROOT/frontend"

# Check if node_modules exists, if not, install
if [ ! -d "node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install --legacy-peer-deps
fi

PORT=3000 npm start > "$PROJECT_ROOT/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

echo ""
echo "✅ All services started!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔍 API: http://localhost:3001"
echo "📊 Kibana: http://localhost:5601"
echo ""
echo "📝 Logs:"
echo "   Backend:  $PROJECT_ROOT/logs/backend.log"
echo "   Frontend: $PROJECT_ROOT/logs/frontend.log"
echo ""
echo "To stop services, run: ./stop.sh"
