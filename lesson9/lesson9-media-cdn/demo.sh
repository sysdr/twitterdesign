#!/bin/bash

echo "🎬 Running Twitter Media CDN Demo..."

# Check if system is running
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "❌ Backend not running. Please start the system first with ./start.sh"
    exit 1
fi

echo "📊 System Health Check..."
curl -s http://localhost:5000/api/health | jq .

echo "📁 Creating test media files..."
mkdir -p demo-files

# Create test image
convert -size 800x600 xc:skyblue -fill white -gravity center \
    -pointsize 72 -annotate +0+0 "Test Image" \
    demo-files/test-image.jpg 2>/dev/null || \
    echo "Creating placeholder test-image.jpg"

# Create test video (placeholder)
echo "Creating test video placeholder..."
touch demo-files/test-video.mp4

echo "📤 Testing Upload API..."
curl -X POST http://localhost:5000/api/media/upload-url \
    -H "Content-Type: application/json" \
    -d '{
        "fileName": "test-image.jpg",
        "fileType": "image/jpeg",
        "userId": "demo-user"
    }' | jq .

echo "📊 Testing Media Stats..."
curl -s http://localhost:5000/api/media/user/demo-user | jq .

echo "✅ Demo completed!"
echo "🌐 Visit http://localhost:3000 to see the full UI"
