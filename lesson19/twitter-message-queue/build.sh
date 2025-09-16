#!/bin/bash

echo "🏗️  Building Twitter Message Queue System..."
echo "============================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start infrastructure
echo "🐳 Starting Kafka cluster and Redis..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if Kafka is ready
echo "🔍 Checking Kafka cluster health..."
for i in {1..30}; do
    if docker exec kafka-1 kafka-topics.sh --bootstrap-server localhost:9092 --list > /dev/null 2>&1; then
        echo "✅ Kafka cluster is ready"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Kafka cluster failed to start"
        exit 1
    fi
    sleep 2
done

# Create Kafka topics
echo "📝 Creating Kafka topics..."
./kafka-config/scripts/create-topics.sh

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Run tests
echo "🧪 Running integration tests..."
cd backend
npm test
cd ..

echo "✅ Build completed successfully!"
echo ""
echo "🚀 Next steps:"
echo "   1. Run './start.sh' to start all services"
echo "   2. Open http://localhost:3000 for the frontend"
echo "   3. Open http://localhost:8080 for Kafka UI"
echo "   4. Run './stop.sh' to stop all services"
