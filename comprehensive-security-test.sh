#!/bin/bash

# Comprehensive School Filtering Security Test
echo "🔒 COMPREHENSIVE SCHOOL FILTERING SECURITY TEST"
echo "==============================================="

BASE_URL="http://localhost:3000"
TEACHER_TOKEN="your-teacher-jwt-token"  # Replace with actual teacher token from School A
ADMIN_TOKEN="your-admin-jwt-token"      # Replace with actual admin token

echo ""
echo "📋 Testing ALL Teacher Endpoints for School Filtering..."
echo "--------------------------------------------------------"

echo ""
echo "1️⃣  Testing Student List (Should only see School A students):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/users/students" | jq -r '.users[] | "Student: \(.name) - School ID: \(.school_id)"'

echo ""
echo "2️⃣  Testing User Details Access (Should only access School A users):"
echo "   - Try accessing a student from School A (should work):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/users/valid-school-a-student-id" | jq '.user.name // .error'

echo ""
echo "   - Try accessing a student from School B (should fail):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/users/valid-school-b-student-id" | jq '.error // "ERROR: Access should be denied!"'

echo ""
echo "3️⃣  Testing Attendance Data (Should only see School A attendance):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/attendance" | jq -r '.attendance[] | "Attendance: \(.users.name) - School: \(.users.school_id)"' | head -5

echo ""
echo "4️⃣  Testing Attendance Stats (Should only include School A data):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/attendance/stats" | jq '.'

echo ""
echo "5️⃣  Testing User Stats (Should only include School A data):"
curl -s -H "Authorization: Bearer $TEACHER_TOKEN" \
     "$BASE_URL/users/students/stats" | jq '.'

echo ""
echo "6️⃣  Testing Manual Attendance Recording:"
echo "   - Try recording attendance for School A student (should work):"
curl -s -X POST -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": "valid-school-a-student-id", "date": "2025-09-26", "status": "present"}' \
     "$BASE_URL/attendance/manual" | jq '.message // .error'

echo ""
echo "   - Try recording attendance for School B student (should fail):"
curl -s -X POST -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"userId": "valid-school-b-student-id", "date": "2025-09-26", "status": "present"}' \
     "$BASE_URL/attendance/manual" | jq '.error // "ERROR: Should be denied!"'

echo ""
echo "7️⃣  Testing User Editing (Should only edit School A users):"
echo "   - Try editing School A student (should work):"
curl -s -X PUT -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Name"}' \
     "$BASE_URL/users/valid-school-a-student-id" | jq '.message // .error'

echo ""
echo "   - Try editing School B student (should fail):"
curl -s -X PUT -H "Authorization: Bearer $TEACHER_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "Updated Name"}' \
     "$BASE_URL/users/valid-school-b-student-id" | jq '.error // "ERROR: Should be denied!"'

echo ""
echo "🎯 Testing Summary"
echo "=================="
echo "✅ If all school filtering is working correctly, you should see:"
echo "   - Teachers only see students/data from their school"
echo "   - Access denied errors when trying to access other schools' data"
echo "   - All stats and counts are school-specific"
echo ""
echo "❌ If you see data from multiple schools or no access errors,"
echo "   there are still security holes that need fixing!"

echo ""
echo "📝 To run this test:"
echo "   1. Get JWT tokens by logging in as teacher and admin"
echo "   2. Replace the token placeholders in this script"
echo "   3. Replace the user ID placeholders with real IDs"
echo "   4. Run the script and verify the results"
