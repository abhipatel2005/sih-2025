#!/bin/bash

# Test script to verify the backend is working correctly
# Run this from the backend directory

echo "🧪 Testing Backend API Endpoints..."

# Base URL
BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing Health Check..."
curl -s "$BASE_URL/health" | grep -q "OK" && echo "✅ Health check passed" || echo "❌ Health check failed"

echo ""
echo "2. Testing Schools Endpoint (should require auth)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/schools")
if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Schools endpoint requires authentication (correct)"
else
  echo "❌ Schools endpoint returned unexpected status: $HTTP_STATUS"
fi

echo ""
echo "3. Testing Users Endpoint (should require auth)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/users")
if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Users endpoint requires authentication (correct)"
else
  echo "❌ Users endpoint returned unexpected status: $HTTP_STATUS"
fi

echo ""
echo "4. Testing Attendance Endpoint (POST without data)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{}' "$BASE_URL/attendance")
if [ "$HTTP_STATUS" = "404" ] || [ "$HTTP_STATUS" = "400" ]; then
  echo "✅ Attendance endpoint responds appropriately to empty POST"
else
  echo "❌ Attendance endpoint returned unexpected status: $HTTP_STATUS"
fi

echo ""
echo "5. Testing Auth Register Endpoint (should require auth)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"name":"test"}' "$BASE_URL/auth/register")
if [ "$HTTP_STATUS" = "401" ]; then
  echo "✅ Auth register requires authentication (correct)"
else
  echo "❌ Auth register returned unexpected status: $HTTP_STATUS"
fi

echo ""
echo "🎉 Backend API Test Complete!"
echo ""
echo "💡 Tips:"
echo "   - If all tests passed, your backend is working correctly"
echo "   - Make sure to run 'npm run seed-dummy' to populate test data"
echo "   - Check server logs for any authentication middleware errors"
echo ""
