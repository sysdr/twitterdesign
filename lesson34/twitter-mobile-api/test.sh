#!/bin/bash

set -e

echo "========================================="
echo "Running Tests"
echo "========================================="

# Test backend
echo "Testing backend..."
cd backend
npm test
cd ..

echo "========================================="
echo "All tests passed!"
echo "========================================="
