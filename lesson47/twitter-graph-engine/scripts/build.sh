#!/bin/bash
set -e

echo "Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install
cd ..

echo "Building backend..."
cd backend && npm run build

echo "Building frontend..."
cd ../frontend && npm run build

echo "Build complete!"
