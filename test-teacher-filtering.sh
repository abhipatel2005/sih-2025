#!/bin/bash

# Final Verification Script for Teacher School Filtering
# This script tests the key endpoints to ensure proper school filtering

echo "🔍 Testing Teacher School Filtering Implementation..."
echo "=================================================="

# Test configuration
BASE_URL="http://localhost:3000"
TEACHER_TOKEN="your-teacher-jwt-token-here"  # Replace with actual teacher token
ADMIN_TOKEN="your-admin-jwt-token-here"      # Replace with actual admin token

echo ""
echo "1. Testing Student Endpoint for Teachers..."
curl -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/users/students" | jq '.'

echo ""
echo "2. Testing Student Stats for Teachers..."
curl -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/users/students/stats" | jq '.'

echo ""
echo "3. Testing Attendance Endpoint for Teachers..."
curl -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/attendance" | jq '.'

echo ""
echo "4. Testing Attendance Stats for Teachers..."
curl -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     "$BASE_URL/attendance/stats" | jq '.'

echo ""
echo "5. Testing Manual Attendance Recording..."
curl -X POST \
     -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": "student-id", "date": "2025-09-26", "timestamp": "2025-09-26T09:00:00Z", "status": "present"}' \
     "$BASE_URL/attendance/manual" | jq '.'

echo ""
echo "✅ Testing Complete!"
echo ""
echo "Note: Replace the token values with actual JWT tokens from your application"
echo "to run this script properly. You can get tokens by:"
echo "1. Logging in as a teacher through the web interface"
echo "2. Opening browser dev tools > Application > Local Storage"
echo "3. Copy the 'authToken' value"
