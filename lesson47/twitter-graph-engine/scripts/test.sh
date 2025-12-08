#!/bin/bash
set -e

echo "Running tests..."
cd backend
npm test

echo "All tests passed!"
