#!/bin/bash

echo "🛑 Stopping Twitter DR System..."

pkill -f "node src/index.js"
pkill -f "react-scripts start"

echo "✅ System stopped!"
