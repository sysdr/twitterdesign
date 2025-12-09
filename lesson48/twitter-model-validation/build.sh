#!/bin/bash
set -e

echo "Building Twitter Model Validation System..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✓ Build complete!"
echo ""
echo "To start the system:"
echo "  ./start.sh"
