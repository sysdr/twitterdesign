#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Starting Twitter Event Sourcing System..."

# Check for existing services on ports
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3001 is already in use. Stopping existing service..."
    pkill -f "node.*3001" || true
    sleep 2
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "⚠️  Port 3000 is already in use. Stopping existing service..."
    pkill -f "react-scripts.*start" || true
    sleep 2
fi

# Start services with docker-compose
echo "🐳 Starting Docker services..."
cd "$SCRIPT_DIR/docker"
if command -v docker-compose &> /dev/null; then
    docker-compose up -d postgres redis 2>/dev/null || docker compose up -d postgres redis
else
    docker compose up -d postgres redis
fi

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U twitter_user >/dev/null 2>&1 || docker compose exec -T postgres pg_isready -U twitter_user >/dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    sleep 1
done

cd "$SCRIPT_DIR/backend"

# Check if backend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Start backend in background
echo "🖥️  Starting backend server..."
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!

cd "$SCRIPT_DIR"

# Check if frontend dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "⚛️  Starting frontend..."
npm start > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ System started successfully!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔌 API: http://localhost:3001"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop the system, run ./stop.sh"

# Save PIDs for stopping
echo $BACKEND_PID > .backend.pid
echo $FRONTEND_PID > .frontend.pid

wait
