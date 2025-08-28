#!/bin/bash

echo "🚀 Starting Twitter Clone Monitoring Stack..."

# Install dependencies
echo "📦 Installing React app dependencies..."
npm install

echo "📦 Installing test dependencies..."
cd tests && npm install && cd ..

# Start Docker monitoring stack
echo "🐳 Starting monitoring services..."
cd docker && docker-compose up -d && cd ..

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Start metrics server
echo "📊 Starting metrics server..."
npm run metrics-server &
METRICS_PID=$!

# Wait for metrics server
sleep 5

# Start React app
echo "🌐 Starting React dashboard..."
npm start &
REACT_PID=$!

echo "✅ All services started!"
echo "📊 Grafana Dashboard: http://localhost:3000 (admin/admin123)"
echo "🔍 Prometheus: http://localhost:9090"
echo "📈 Jaeger Tracing: http://localhost:16686"
echo "🚨 Alertmanager: http://localhost:9093"
echo "🐦 Twitter Dashboard: http://localhost:3000"

# Save PIDs
echo $METRICS_PID > .metrics.pid
echo $REACT_PID > .react.pid

# Run tests
echo "🧪 Running tests..."
cd tests && npm test && cd ..

echo "🎉 Setup complete! Check the dashboard at http://localhost:3000"
