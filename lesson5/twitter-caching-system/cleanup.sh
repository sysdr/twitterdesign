#!/bin/bash

echo "🧹 Learning Path Generator - Complete Cleanup"
echo "============================================="

# Stop all running processes first
echo "🛑 Stopping all running processes..."
./stop.sh

echo ""
echo "🗑️  Starting comprehensive cleanup..."

# Remove Python cache and temporary files
echo "🐍 Cleaning Python cache and temp files..."
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find . -type d -name "*.egg-info" -exec rm -rf {} + 2>/dev/null
find . -type d -name "*.egg" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".coverage" -delete 2>/dev/null
find . -type f -name ".coverage" -delete 2>/dev/null
find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".tox" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".mypy_cache" -exec rm -rf {} + 2>/dev/null
find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null

# Remove Node.js cache and dependencies
echo "📦 Cleaning Node.js cache and dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "🗑️  Removing frontend node_modules..."
    rm -rf frontend/node_modules
fi
if [ -d "frontend/.next" ]; then
    echo "🗑️  Removing frontend .next build..."
    rm -rf frontend/.next
fi
if [ -f "frontend/package-lock.json" ]; then
    echo "🗑️  Removing package-lock.json..."
    rm -f frontend/package-lock.json
fi
if [ -f "frontend/yarn.lock" ]; then
    echo "🗑️  Removing yarn.lock..."
    rm -f frontend/yarn.lock
fi

# Remove Python virtual environment
echo "🐍 Cleaning Python virtual environment..."
if [ -d "venv" ]; then
    echo "🗑️  Removing virtual environment..."
    rm -rf venv
fi
if [ -d ".venv" ]; then
    echo "🗑️  Removing .venv directory..."
    rm -rf .venv
fi
if [ -d "env" ]; then
    echo "🗑️  Removing env directory..."
    rm -rf env
fi

# Remove Python dependencies
echo "🐍 Cleaning Python dependencies..."
if [ -f "backend/requirements.txt" ]; then
    echo "🗑️  Removing installed packages..."
    pip uninstall -y -r backend/requirements.txt 2>/dev/null || true
fi

# Remove database files
echo "🗄️  Cleaning database files..."
find . -name "*.db" -delete
find . -name "*.sqlite" -delete
find . -name "*.sqlite3" -delete

# Remove log files
echo "📝 Cleaning log files..."
find . -name "*.log" -delete
find . -name "logs" -type d -exec rm -rf {} + 2>/dev/null

# Remove temporary files
echo "📁 Cleaning temporary files..."
find . -name "*.tmp" -delete
find . -name "*.temp" -delete
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete
find . -name ".DS_Store" -delete

# Remove PID files
echo "🆔 Cleaning PID files..."
rm -f .backend_pid .frontend_pid .celery_pid

# Remove Docker artifacts
echo "🐳 Cleaning Docker artifacts..."
docker system prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true
docker image prune -f 2>/dev/null || true

# Remove build artifacts
echo "🔨 Cleaning build artifacts..."
find . -name "dist" -type d -exec rm -rf {} + 2>/dev/null
find . -name "build" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.spec" -delete

# Remove IDE and editor files
echo "💻 Cleaning IDE and editor files..."
find . -name ".vscode" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".idea" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.swp" -delete
find . -name "*.swo" -delete
find . -name "*~" -delete

# Remove test artifacts
echo "🧪 Cleaning test artifacts..."
find . -name ".pytest_cache" -type d -exec rm -rf {} + 2>/dev/null
find . -name "htmlcov" -type d -exec rm -rf {} + 2>/dev/null
find . -name ".coverage" -delete
find . -name "coverage.xml" -delete

# Remove environment files (but keep .env.example)
echo "🔐 Cleaning environment files..."
find . -name ".env" -not -name ".env.example" -delete

# Clean npm cache globally
echo "📦 Cleaning global npm cache..."
npm cache clean --force 2>/dev/null || true

# Clean pip cache
echo "🐍 Cleaning pip cache..."
pip cache purge 2>/dev/null || true

# Remove any remaining temporary directories
echo "🗂️  Cleaning remaining temp directories..."
find . -type d -name "tmp" -exec rm -rf {} + 2>/dev/null
find . -type d -name "temp" -exec rm -rf {} + 2>/dev/null

echo ""
echo "✅ Cleanup completed successfully!"
echo ""
echo "🎯 What was cleaned:"
echo "   • Python cache and virtual environments"
echo "   • Node.js dependencies and build files"
echo "   • Database files"
echo "   • Log files"
echo "   • Temporary files"
echo "   • PID files"
echo "   • Docker artifacts"
echo "   • Build artifacts"
echo "   • IDE/Editor files"
echo "   • Test artifacts"
echo "   • Environment files (except .env.example)"
echo "   • Global npm and pip caches"
echo ""
echo "🚀 To restart the system, run: ./start.sh"
echo "⚠️  Note: You'll need to reinstall dependencies on first run"
