#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "Building Production Readiness Assessment System..."

echo "Installing backend dependencies..."
cd "$SCRIPT_DIR/backend" && npm install && cd "$SCRIPT_DIR"

echo "Installing frontend dependencies..."
cd "$SCRIPT_DIR/frontend" && npm install --legacy-peer-deps && cd "$SCRIPT_DIR"

echo "Building backend..."
cd "$SCRIPT_DIR/backend" && npm run build && cd "$SCRIPT_DIR"

echo "✅ Build complete!"
