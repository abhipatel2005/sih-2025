#!/bin/bash

# Test Complete Student Creation API
echo "=== Testing Complete Student Creation API ==="
echo ""

# Get teacher token
TEACHER_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testteacher@example.com",
    "password": "teacher123"
  }')

TEACHER_TOKEN=$(echo "$TEACHER_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TEACHER_TOKEN" ]; then
  echo "❌ Could not get teacher token"
  exit 1
fi

echo "✅ Got teacher token"
echo ""

# Test creating a student with all fields
echo "🔍 Creating student with complete information..."
STUDENT_CREATE_RESPONSE=$(curl -s -X POST http://localhost:3000/users/students \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -d '{
    "name": "Complete Student Test",
    "email": "completestudent@example.com",
    "password": "student123",
    "rfidTag": "STDCOMPLETE001",
    "phone": "+91-9876543210",
    "dob": "2005-06-15",
    "gender": "Male",
    "category": "General",
    "std": "10th",
    "blood_group": "B+",
    "aadhar_id": "123456789012",
    "address": "123 School Street, Education City, State 123456"
  }')

echo "Student creation response:"
echo "$STUDENT_CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STUDENT_CREATE_RESPONSE"

echo ""

# Verify the student appears in the list
echo "🔍 Verifying student appears in teacher's list..."
STUDENTS_LIST_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students \
  -H "Authorization: Bearer $TEACHER_TOKEN")

echo "Students list:"
echo "$STUDENTS_LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$STUDENTS_LIST_RESPONSE"

echo ""
echo "✅ Complete student creation test finished!"
