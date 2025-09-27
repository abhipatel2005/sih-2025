#!/bin/bash

# Simple Teacher API Test
echo "=== Testing Teacher Access to Students API ==="
echo ""

# Change to backend directory
cd /Users/yashdarji/Workspace/sih-2025/backend

# Kill any existing server
echo "Killing any existing server on port 3000..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start server in background
echo "Starting backend server..."
npm start > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 8

# Test endpoints
echo ""
echo "1. Testing admin login..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@example.com",
    "password": "admin123"
  }')
echo "Admin login response: $ADMIN_RESPONSE"

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Admin token extracted: $ADMIN_TOKEN"

if [ -n "$ADMIN_TOKEN" ]; then
  echo ""
  echo "2. Creating teacher user..."
  TEACHER_RESPONSE=$(curl -s -X POST http://localhost:3000/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "name": "Test Teacher",
      "rfidTag": "TCHR999",
      "email": "testteacher@example.com",
      "password": "teacher123",
      "role": "teacher",
      "school_id": "2ab67cdc-eac9-4ba4-bdac-d38e1ad8213a"
    }')
  echo "Teacher creation response: $TEACHER_RESPONSE"

  echo ""
  echo "3. Testing teacher login..."
  TEACHER_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testteacher@example.com",
      "password": "teacher123"
    }')
  echo "Teacher login response: $TEACHER_LOGIN_RESPONSE"

  TEACHER_TOKEN=$(echo "$TEACHER_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "Teacher token: $TEACHER_TOKEN"

  if [ -n "$TEACHER_TOKEN" ]; then
    echo ""
    echo "4. Testing teacher access to students list..."
    STUDENTS_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Students list response: $STUDENTS_RESPONSE"

    echo ""
    echo "5. Testing teacher creating a student..."
    STUDENT_CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/users/students \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TEACHER_TOKEN" \
      -d '{
        "name": "Test Student",
        "rfidTag": "STD999",
        "email": "teststudent@example.com",
        "password": "student123",
        "std": "10"
      }')
    echo "Student creation response: $STUDENT_CREATE_RESPONSE"

    echo ""
    echo "6. Verifying student appears in teacher's list..."
    STUDENTS_AFTER_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Updated students list: $STUDENTS_AFTER_RESPONSE"

    echo ""
    echo "7. Testing teacher access to admin endpoint (should fail)..."
    ADMIN_ENDPOINT_RESPONSE=$(curl -s -X GET http://localhost:3000/users \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Admin endpoint response: $ADMIN_ENDPOINT_RESPONSE"

    echo ""
    echo "SUCCESS: All tests completed!"
  else
    echo "ERROR: Could not get teacher token"
  fi
else
  echo "ERROR: Could not get admin token"
fi

# Clean up
echo ""
echo "Cleaning up..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true

echo ""
echo "=== Test Complete ==="
