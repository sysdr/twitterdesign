#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo "Starting Configuration Management System..."
echo "Working directory: $SCRIPT_DIR"
npm run dev &
echo "Dashboard available at http://localhost:3000"
wait
