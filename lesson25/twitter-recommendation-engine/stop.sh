#!/bin/bash

echo "🛑 Stopping Twitter Recommendation Engine..."

# Kill all related processes
pkill -f "vite"
pkill -f "node.*3000"
pkill -f "node.*4173"

echo "✅ All services stopped"
