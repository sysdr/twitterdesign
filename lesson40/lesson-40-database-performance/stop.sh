#!/bin/bash
echo "Stopping application..."
pkill -f "react-scripts" || true
pkill -f "react-scripts/scripts/start.js" || true
echo "Stopped."
