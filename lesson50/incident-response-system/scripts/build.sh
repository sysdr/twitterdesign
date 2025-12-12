#!/bin/bash
set -e

echo "Building Incident Response System..."

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install --silent
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo "✓ Build complete!"
