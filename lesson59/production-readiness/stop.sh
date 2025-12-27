#!/bin/bash

echo "Stopping Production Readiness Assessment System..."

# Kill processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "✅ All services stopped"
