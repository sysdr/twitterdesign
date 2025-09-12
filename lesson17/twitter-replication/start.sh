#!/bin/bash
set -e

echo "🚀 Starting Twitter Master-Slave Replication System"
echo "================================================="

# Create virtual environment and install dependencies
echo "📦 Setting up environment..."
npm install

# Start databases
echo "🐘 Starting databases..."
docker-compose up -d

# Wait for databases
echo "⏳ Waiting for database initialization..."
sleep 30

# Start servers concurrently
echo "🌟 Starting application servers..."
npx concurrently \
  "cd src && node --loader ts-node/esm server.ts" \
  "npm run dev" \
  --names "API,WEB" \
  --prefix-colors "blue,green"
