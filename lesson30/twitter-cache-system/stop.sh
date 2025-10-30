#!/bin/bash

echo "🛑 Stopping Advanced Cache System..."

# Kill all node processes for this project
pkill -f "vite"
pkill -f "node server/index.js"

echo "✅ All services stopped"
