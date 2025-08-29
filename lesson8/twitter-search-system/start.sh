#!/bin/bash
echo "🚀 Starting Twitter Search System..."
cd backend && npm run dev &
cd ../frontend && npm run dev &
echo "✅ Services started! Frontend: http://localhost:3000, Backend: http://localhost:3001"
