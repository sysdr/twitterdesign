#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔨 Building Twitter Event Sourcing System..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$SCRIPT_DIR/backend"
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build backend
echo "🏗️  Building backend..."
npm run build

cd "$SCRIPT_DIR"

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build frontend
echo "🏗️  Building frontend..."
npm run build

echo "✅ Build completed successfully!"
