#!/bin/bash

echo "Stopping all services..."
pkill -f "tsx watch" || true
pkill -f "vite" || true
echo "✅ All services stopped"
