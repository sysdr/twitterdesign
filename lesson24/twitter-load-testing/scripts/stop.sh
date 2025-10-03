#!/bin/bash
echo "🛑 Stopping Multi-Region Load Testing Dashboard..."

# Kill any running node processes for this project
pkill -f "vite"
pkill -f "load-testing"

echo "✅ Services stopped"
