#!/bin/bash

echo "Building Security at Scale..."

# Install backend dependencies
cd backend
npm install
npm run build
cd ..

# Install frontend dependencies
cd frontend
npm install
npm run build
cd ..

echo "✅ Build complete!"
