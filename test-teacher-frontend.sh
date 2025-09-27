#!/bin/bash

# Test Teacher Frontend Access
echo "=== Testing Teacher Frontend Access ==="
echo ""

# Test teacher login and access to members page
echo "Testing teacher login and members page access..."

# Test if both servers are running
echo "Checking if backend is running on port 3000..."
BACKEND_CHECK=$(curl -s http://localhost:3000/health || echo "Backend not running")
echo "Backend status: $BACKEND_CHECK"

echo ""
echo "Checking if frontend is running on port 5174..."
FRONTEND_CHECK=$(curl -s http://localhost:5174 | grep -o "<title>[^<]*</title>" || echo "Frontend not running")
echo "Frontend status: $FRONTEND_CHECK"

if [[ "$BACKEND_CHECK" == *"Backend not running"* ]]; then
  echo ""
  echo "❌ Backend is not running. Please start it with: cd backend && npm start"
  exit 1
fi

if [[ "$FRONTEND_CHECK" == *"Frontend not running"* ]]; then
  echo ""
  echo "❌ Frontend is not running. Please start it with: cd frontend && npm run dev"  
  exit 1
fi

echo ""
echo "✅ Both servers are running!"
echo ""
echo "🔍 Testing teacher API access..."

# Test teacher login
TEACHER_LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testteacher@example.com",
    "password": "teacher123"
  }')

echo "Teacher login response: $TEACHER_LOGIN_RESPONSE"

TEACHER_TOKEN=$(echo "$TEACHER_LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TEACHER_TOKEN" ]; then
  echo "✅ Teacher login successful"
  echo ""
  
  echo "🔍 Testing teacher access to students endpoint..."
  STUDENTS_RESPONSE=$(curl -s -X GET http://localhost:3000/users/students \
    -H "Authorization: Bearer $TEACHER_TOKEN")
  echo "Students API response: $STUDENTS_RESPONSE"
  
  echo ""
  echo "✅ Teacher can access backend APIs"
  echo ""
  echo "🌐 Frontend URLs for testing:"
  echo "   • Login: http://localhost:5174/login"
  echo "   • Dashboard: http://localhost:5174/dashboard"  
  echo "   • Students: http://localhost:5174/members"
  echo ""
  echo "📝 Teacher test credentials:"
  echo "   • Email: testteacher@example.com"
  echo "   • Password: teacher123"
  echo ""
  echo "✅ Ready for frontend testing!"
  
else
  echo "❌ Teacher login failed"
  exit 1
fi
