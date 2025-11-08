#!/bin/bash

echo "=========================================="
echo "Security at Scale - Demo Script"
echo "=========================================="

API_BASE="http://localhost:3000/api"

echo -e "\n1. Health Check"
curl -s "$API_BASE/health" | jq '.'

echo -e "\n2. Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"demo_user","email":"demo@example.com","password":"SecurePass123!"}')
echo "$REGISTER_RESPONSE" | jq '.'

echo -e "\n3. Login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"SecurePass123!"}')
echo "$LOGIN_RESPONSE" | jq '.'

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.refreshToken')

echo -e "\n4. Get Threat Score"
curl -s "$API_BASE/user/threat-score" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo -e "\n5. Simulate Failed Login Attempts"
for i in {1..3}; do
  echo "Attempt $i:"
  curl -s -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@example.com","password":"WrongPassword"}' | jq '.'
  sleep 1
done

echo -e "\n6. Get Security Events"
curl -s "$API_BASE/security/events" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.events | .[0:5]'

echo -e "\n7. Get Security Stats"
curl -s "$API_BASE/security/stats" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo -e "\n8. Refresh Access Token"
REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
echo "$REFRESH_RESPONSE" | jq '.'

NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')

echo -e "\n9. Test Rate Limiting (50 rapid requests)"
for i in {1..50}; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "$API_BASE/health")
  STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
  if [ "$STATUS_CODE" == "429" ]; then
    echo "✅ Rate limit triggered at request $i"
    break
  fi
done

echo -e "\n10. Logout"
curl -s -X POST "$API_BASE/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" | jq '.'

echo -e "\n=========================================="
echo "Demo complete! Check the dashboard at http://localhost:5173"
echo "=========================================="
