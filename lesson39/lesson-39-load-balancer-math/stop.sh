#!/bin/bash
echo "🛑 Stopping server..."
pkill -f "vite" || true
echo "Server stopped"
