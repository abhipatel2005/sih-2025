#!/bin/bash

echo "🧪 Testing Teacher Access to Students Endpoint"
echo "=============================================="

# Test login with teacher account
echo "📝 Step 1: Login as teacher..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test.teacher@school.edu",
    "password": "teacher123"
  }')

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from login"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:20}..."

# Test the old /users endpoint (should fail with 403)
echo ""
echo "📝 Step 2: Testing old /users endpoint (should fail)..."
USERS_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/users)

echo "Users Response: $USERS_RESPONSE"

# Test the new /users/students endpoint (should succeed)
echo ""
echo "📝 Step 3: Testing new /users/students endpoint (should succeed)..."
STUDENTS_RESPONSE=$(curl -s -w "HTTP_STATUS:%{http_code}" \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/users/students)

echo "Students Response: $STUDENTS_RESPONSE"

echo ""
echo "🎯 Test completed!"
