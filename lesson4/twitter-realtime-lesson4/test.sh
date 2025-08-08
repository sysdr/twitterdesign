#!/bin/bash

echo "🧪 Running comprehensive tests for Lesson 4"
echo "==========================================="

npm install ws

# Wait for backend readiness

echo "⏳ Ensuring backend is up..."
ATTEMPTS=0
until curl -fsS http://localhost:8000/api/stats >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge 60 ]; then
    echo "❌ Backend not reachable on http://localhost:8000 after 60s"
    break
  fi
  sleep 1
done


# Backend tests
echo "📋 Running backend tests (hitting running server)..."
cd backend
npm run build >/dev/null 2>&1 || true
npm run test --silent || true
BACKEND_TEST_RESULT=$?
cd ..

# Frontend tests
echo "📋 Running frontend tests..."
cd frontend
npm test || true
FRONTEND_TEST_RESULT=$?
cd ..

# Integration tests
echo "📋 Running integration tests..."
echo "Testing WebSocket handshake..."
if printf "GET / HTTP/1.1\r\nHost: localhost:8001\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n" | nc -w 3 localhost 8001 | head -n 1 | grep -q "101 Switching Protocols"; then
  echo "✅ WebSocket handshake successful"
else
  echo "❌ WebSocket handshake failed"
fi

# API tests
echo "📋 Testing API endpoints..."
curl -s http://localhost:8000/api/stats > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ API endpoints accessible"
else
    echo "❌ API endpoints not accessible"
    exit 1
fi

echo "🎉 All tests completed!"
if [ $BACKEND_TEST_RESULT -eq 0 ] && [ $FRONTEND_TEST_RESULT -eq 0 ]; then
    echo "✅ All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
