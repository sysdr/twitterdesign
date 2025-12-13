#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "Stopping Configuration Management System processes..."
pkill -f "vite.*config-management-system" || true
pkill -f "node.*config-management-system" || true
# Also kill processes in the project directory
ps aux | grep -E "$SCRIPT_DIR.*(vite|npm.*dev)" | grep -v grep | awk '{print $2}' | xargs -r kill 2>/dev/null || true
echo "All processes stopped"
