#!/bin/bash

echo "Stopping services..."
pkill -f "node.*backend" || true
pkill -f "vite" || true
echo "Services stopped"
