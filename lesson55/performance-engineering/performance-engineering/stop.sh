#!/bin/bash

echo "Stopping Performance Engineering System..."

# Kill processes on ports
lsof -ti:3000,4000,4001 | xargs kill -9 2>/dev/null || true

echo "✅ System stopped"
