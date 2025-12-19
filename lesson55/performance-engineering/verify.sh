#!/bin/bash

echo "Verifying Performance Engineering System..."
echo ""

# Check if files exist
FILES=(
  "src/collectors/MetricsCollector.ts"
  "src/analyzers/PerformanceAnalyzer.ts"
  "src/orchestrator/TestOrchestrator.ts"
  "src/optimizer/OptimizationEngine.ts"
  "src/index.ts"
  "src/dashboard/App.tsx"
  "tests/performance/suite.ts"
)

echo "Checking files..."
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (missing)"
  fi
done

echo ""
echo "Checking dependencies..."
if [ -d "node_modules" ]; then
  echo "✓ Dependencies installed"
else
  echo "✗ Dependencies not installed"
  echo "  Run: npm install"
fi

echo ""
echo "Project structure:"
find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.sh" | grep -v node_modules | head -20

echo ""
echo "Ready to start!"


