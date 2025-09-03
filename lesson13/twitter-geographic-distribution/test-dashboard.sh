#!/bin/bash

echo "🧪 Running Dashboard Tests..."

# Test 1: Check if server is running
echo "Test 1: Server Status"
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running on port 3000"
else
    echo "❌ Server is not running"
    exit 1
fi

# Test 2: Check regions API
echo "Test 2: Regions API"
regions_response=$(curl -s http://localhost:3000/api/regions)
if echo "$regions_response" | jq -e '.[0].id' > /dev/null; then
    echo "✅ Regions API is working"
    echo "   Found regions: $(echo "$regions_response" | jq -r '.[].id' | tr '\n' ' ')"
else
    echo "❌ Regions API failed"
    exit 1
fi

# Test 3: Check CDN stats API
echo "Test 3: CDN Stats API"
cdn_response=$(curl -s http://localhost:3000/api/cdn-stats)
if echo "$cdn_response" | jq -e '.["us-east"]' > /dev/null; then
    echo "✅ CDN Stats API is working"
    echo "   Hit rates: $(echo "$cdn_response" | jq -r '.[] | .hitRate' | tr '\n' ' ')"
else
    echo "❌ CDN Stats API failed"
    exit 1
fi

# Test 4: Check dashboard HTML
echo "Test 4: Dashboard HTML"
if curl -s http://localhost:3000 | grep -q "Twitter Geographic Distribution"; then
    echo "✅ Dashboard HTML is accessible"
else
    echo "❌ Dashboard HTML failed"
    exit 1
fi

# Test 5: Check for non-zero values
echo "Test 5: Data Validation"
latency_values=$(echo "$regions_response" | jq -r '.[].latency')
cdn_sizes=$(echo "$cdn_response" | jq -r '.[].size')

all_non_zero=true
for value in $latency_values; do
    if [ "$value" -eq 0 ]; then
        all_non_zero=false
        break
    fi
done

for value in $cdn_sizes; do
    if [ "$value" -eq 0 ]; then
        all_non_zero=false
        break
    fi
done

if [ "$all_non_zero" = true ]; then
    echo "✅ All metrics have non-zero values"
else
    echo "❌ Some metrics are zero"
fi

echo "🎉 All tests passed!"
echo "📊 Dashboard is available at: http://localhost:3000"
