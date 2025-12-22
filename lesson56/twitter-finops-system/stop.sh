#!/bin/bash

echo "Stopping Twitter FinOps System..."

# Kill processes on ports 3000 and 4000
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true

echo "All services stopped."
