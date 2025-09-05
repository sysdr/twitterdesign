#!/bin/bash

echo "🛑 Stopping Twitter Load Balancer Dashboard..."

# Kill any running Node processes for this project
pkill -f "vite.*3000" || true
pkill -f "node.*3000" || true

echo "✅ All services stopped"
