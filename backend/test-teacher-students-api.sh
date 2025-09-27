#!/bin/bash

# Test Teacher Access to Students API
echo "=== Testing Teacher Access to Students API ==="
echo ""

# Start backend server in background
echo "Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!

# Wait for server to start
sleep 5

echo "Testing endpoints..."

# 1. Test login as admin (to create a teacher first)
echo "1. Testing admin login..."
ADMIN_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testadmin@example.com",
    "password": "admin123"
  }')
echo "Admin login response: $ADMIN_LOGIN"

# Extract admin token
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Admin token: $ADMIN_TOKEN"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ERROR: Could not get admin token. Creating admin user first..."
  
  # Create admin user
  node create-admin.js
  
  # Try login again
  ADMIN_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testadmin@example.com",
      "password": "admin123"
    }')
  echo "Admin login response (retry): $ADMIN_LOGIN"
  
  ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "Admin token (retry): $ADMIN_TOKEN"
fi

# 2. Create a teacher user if admin token works
if [ ! -z "$ADMIN_TOKEN" ]; then
  echo ""
  echo "2. Creating a teacher user..."
  TEACHER_CREATE=$(curl -s -X POST http://localhost:5000/api/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "name": "Test Teacher",
      "rfidTag": "TCHR001",
      "email": "teacher@example.com",
      "password": "teacher123",
      "role": "teacher",
      "school_id": 1
    }')
  echo "Teacher creation response: $TEACHER_CREATE"
  
  # 3. Test teacher login
  echo ""
  echo "3. Testing teacher login..."
  TEACHER_LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "teacher@example.com",
      "password": "teacher123"
    }')
  echo "Teacher login response: $TEACHER_LOGIN"
  
  # Extract teacher token
  TEACHER_TOKEN=$(echo $TEACHER_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  echo "Teacher token: $TEACHER_TOKEN"
  
  if [ ! -z "$TEACHER_TOKEN" ]; then
    # 4. Test teacher access to students endpoint (GET)
    echo ""
    echo "4. Testing teacher access to GET /api/users/students..."
    STUDENTS_LIST=$(curl -s -X GET http://localhost:5000/api/users/students \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Students list response: $STUDENTS_LIST"
    
    # 5. Test teacher creating a student (POST)
    echo ""
    echo "5. Testing teacher creating a student via POST /api/users/students..."
    STUDENT_CREATE=$(curl -s -X POST http://localhost:5000/api/users/students \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TEACHER_TOKEN" \
      -d '{
        "name": "Test Student",
        "rfidTag": "STD001",
        "email": "student@example.com",
        "password": "student123",
        "std": "10"
      }')
    echo "Student creation response: $STUDENT_CREATE"
    
    # 6. Verify student was created in the teacher's school
    echo ""
    echo "6. Verifying student appears in teacher's students list..."
    STUDENTS_LIST_AFTER=$(curl -s -X GET http://localhost:5000/api/users/students \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Students list after creation: $STUDENTS_LIST_AFTER"
    
    # 7. Test teacher access to admin endpoints (should fail)
    echo ""
    echo "7. Testing teacher access to admin endpoint (should fail)..."
    ADMIN_ENDPOINT_TEST=$(curl -s -X GET http://localhost:5000/api/users \
      -H "Authorization: Bearer $TEACHER_TOKEN")
    echo "Admin endpoint access response: $ADMIN_ENDPOINT_TEST"
    
  else
    echo "ERROR: Could not get teacher token"
  fi
else
  echo "ERROR: Could not get admin token"
fi

# Clean up
echo ""
echo "Cleaning up..."
kill $BACKEND_PID

echo ""
echo "=== Test Complete ==="
