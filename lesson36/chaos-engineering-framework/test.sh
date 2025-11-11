#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "===================================="
echo "Running Tests"
echo "===================================="

cd backend
npm test
cd ..

echo "✅ All tests passed!"
