#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "===================================="
echo "Building Chaos Engineering Framework"
echo "===================================="

# Backend
echo "Installing backend dependencies..."
cd backend
npm install
echo "Building backend..."
npm run build
cd ..

# Frontend
echo "Installing frontend dependencies..."
cd frontend
npm install
echo "Building frontend..."
npm run build
cd ..

echo "✅ Build complete!"
