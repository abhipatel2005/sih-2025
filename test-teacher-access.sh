#!/bin/bash

echo "Testing teacher access to users/students endpoint..."

# First, let's check if the server is running
curl -s http://localhost:3000/health > /dev/null
if [ $? -ne 0 ]; then
    echo "Server is not running on localhost:3000"
    echo "Starting server..."
    cd /Users/yashdarji/Workspace/sih-2025/backend
    npm start &
    SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 3
fi

# Test login as teacher first
echo "1. Testing teacher login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@test.com",
    "password": "password123"
  }')

echo "Login response: $LOGIN_RESPONSE"

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to get token. Creating a test teacher user first..."
    
    # Login as admin to create teacher
    ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/auth/login \
      -H "Content-Type: application/json" \
      -d '{
        "email": "admin@admin.com",
        "password": "admin123"
      }')
    
    ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    
    if [ ! -z "$ADMIN_TOKEN" ]; then
        echo "Creating test teacher..."
        curl -s -X POST http://localhost:3000/users \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $ADMIN_TOKEN" \
          -d '{
            "name": "Test Teacher",
            "email": "teacher@test.com",
            "password": "password123",
            "rfidTag": "TEST_TEACHER_001",
            "role": "teacher",
            "school_id": "default"
          }'
          
        # Try login again
        LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
          -H "Content-Type: application/json" \
          -d '{
            "email": "teacher@test.com",
            "password": "password123"
          }')
        
        TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
fi

if [ -z "$TOKEN" ]; then
    echo "Still failed to get teacher token. Exiting."
    exit 1
fi

echo "Got teacher token: ${TOKEN:0:20}..."

# Test accessing /users/students endpoint (should work for teachers)
echo ""
echo "2. Testing GET /users/students (should work)..."
STUDENTS_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students \
  -H "Authorization: Bearer $TOKEN")

echo "Students response: $STUDENTS_RESPONSE"

# Test accessing /users endpoint (should fail for teachers)
echo ""
echo "3. Testing GET /users (should fail for teachers)..."
USERS_RESPONSE=$(curl -s -X GET http://localhost:3000/users \
  -H "Authorization: Bearer $TOKEN")

echo "Users response: $USERS_RESPONSE"

# Test accessing user stats
echo ""
echo "4. Testing GET /users/stats/summary (should work for teachers)..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:3000/users/stats/summary \
  -H "Authorization: Bearer $TOKEN")

echo "Stats response: $STATS_RESPONSE"

# Test accessing student stats
echo ""
echo "5. Testing GET /users/students/stats (should work for teachers)..."
STUDENT_STATS_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students/stats \
  -H "Authorization: Bearer $TOKEN")

echo "Student stats response: $STUDENT_STATS_RESPONSE"

# Clean up if we started the server
if [ ! -z "$SERVER_PID" ]; then
    echo ""
    echo "Stopping server..."
    kill $SERVER_PID
fi

echo ""
echo "Test complete!"
