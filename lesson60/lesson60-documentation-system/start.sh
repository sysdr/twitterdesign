#!/bin/bash

echo "========================================="
echo "Starting Documentation System"
echo "========================================="

echo "Starting webpack dev server..."
npm start &

echo ""
echo "Dashboard will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"

wait
