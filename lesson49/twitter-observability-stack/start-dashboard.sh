#!/bin/bash

echo "=========================================="
echo "Starting Dashboard Server"
echo "=========================================="

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "Building project..."
    npm run build
fi

# Check if dashboard public files exist
if [ ! -d "dist/dashboard/public" ]; then
    echo "Copying dashboard files..."
    npm run copy-dashboard
fi

echo "Starting dashboard server on port 8080..."
echo ""
echo "Dashboard will be available at: http://localhost:8080"
echo "Make sure the main API server is running on port 3000"
echo ""

npm run start:dashboard


