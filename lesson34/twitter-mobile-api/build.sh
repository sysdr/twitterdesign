#!/bin/bash

set -e

echo "========================================="
echo "Building Mobile API Project"
echo "========================================="

# Build backend
echo "Building backend..."
cd backend
npm install
npm run build
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "========================================="
echo "Build completed successfully!"
echo "========================================="
