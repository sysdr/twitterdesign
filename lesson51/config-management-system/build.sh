#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Running tests..."
npm test

echo "Building application..."
npm run build

echo "Build completed successfully!"
