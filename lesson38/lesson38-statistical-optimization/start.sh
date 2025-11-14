#!/bin/bash
set -e

echo "=== Starting Statistical Performance Optimizer ==="

# Start backend and frontend
npm run dev &

echo "=== System Started ==="
echo "Dashboard: http://localhost:3000"
echo "API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop"

wait
