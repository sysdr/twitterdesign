#!/bin/bash

echo "🔧 Building Content Moderation System..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
npm run build
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
npm run build
cd ..

# Setup Python virtual environment for ML service
echo "🐍 Setting up ML service..."
cd ml-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Setup database
echo "🗄️ Setting up database..."
# In production, use proper database setup
# For demo, create tables
psql -h localhost -U postgres -d content_moderation -f database/schema.sql 2>/dev/null || echo "Database setup will be handled by docker"

echo "✅ Build complete!"
