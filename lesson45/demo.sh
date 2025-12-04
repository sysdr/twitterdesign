#!/bin/bash
set -e

echo "===================================="
echo "Twitter MLOps System - Demo"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000"

echo "1. Checking system health..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

echo "2. Getting production model info..."
curl -s "$BASE_URL/models/production" | jq '.'
echo ""

echo "3. Computing user features..."
curl -s -X POST "$BASE_URL/features/user/demo_user_1/compute" | jq '.'
echo ""

echo "4. Computing tweet features..."
for i in {1..5}; do
  curl -s -X POST "$BASE_URL/features/tweet/demo_tweet_$i/compute" | jq '.'
done
echo ""

echo "5. Running prediction..."
curl -s -X POST "$BASE_URL/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "demo_user_1",
    "candidateTweets": ["demo_tweet_1", "demo_tweet_2", "demo_tweet_3", "demo_tweet_4", "demo_tweet_5"]
  }' | jq '.'
echo ""

echo "6. Load test (100 concurrent predictions)..."
START=$(date +%s%3N)
for i in {1..100}; do
  curl -s -X POST "$BASE_URL/predict" \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"user_$i\",\"candidateTweets\":[\"tweet_1\",\"tweet_2\"]}" > /dev/null &
done
wait
END=$(date +%s%3N)
DURATION=$((END - START))
THROUGHPUT=$((100000 / DURATION))
echo "Completed 100 predictions in ${DURATION}ms"
echo "Throughput: ${THROUGHPUT} predictions/second"
echo ""

echo "7. Checking for drift..."
MODEL_ID=$(curl -s "$BASE_URL/models/production" | jq -r '.model.modelId')
curl -s "$BASE_URL/metrics/performance/$MODEL_ID" | jq '.metrics.drift'
echo ""

echo "===================================="
echo "Demo completed successfully!"
echo "Open http://localhost:3000 to view dashboard"
echo "===================================="
