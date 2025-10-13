#!/bin/bash

echo "⏹️ Stopping all services..."

# Kill any running processes on port 3000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

echo "✅ All services stopped"
