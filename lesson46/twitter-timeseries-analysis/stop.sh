#!/bin/bash
echo "Stopping all services..."
pkill -f "vite" || true
echo "Services stopped"
