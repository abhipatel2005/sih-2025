#!/bin/bash

# Test Updated Student Form
echo "=== Testing Updated Student Form ==="
echo ""

# Check if both servers are running
echo "Checking server status..."
BACKEND_CHECK=$(curl -s http://localhost:3000/health 2>/dev/null || echo "Backend not running")
FRONTEND_CHECK=$(curl -s http://localhost:5174 2>/dev/null | grep -o "<title>[^<]*</title>" || echo "Frontend not running")

echo "Backend status: $BACKEND_CHECK"
echo "Frontend status: $FRONTEND_CHECK"

if [[ "$BACKEND_CHECK" == *"Backend not running"* ]]; then
  echo "❌ Backend is not running. Please start it with: cd backend && npm start"
  exit 1
fi

if [[ "$FRONTEND_CHECK" == *"Frontend not running"* ]]; then
  echo "❌ Frontend is not running. Please start it with: cd frontend && npm run dev"
  exit 1
fi

echo ""
echo "✅ Both servers are running!"
echo ""

echo "📝 Updated Student Form Fields:"
echo "   ✅ Name"
echo "   ✅ Email"
echo "   ✅ RFID Tag"
echo "   ✅ Password"
echo "   ✅ Phone"
echo "   ✅ Date of Birth"
echo "   ✅ Gender (Male/Female/Other)"
echo "   ✅ Category (General/OBC/SC/ST/Other)"
echo "   ✅ Standard/Class (for students)"
echo "   ✅ Blood Group (A+/A-/B+/B-/AB+/AB-/O+/O-)"
echo "   ✅ Aadhaar ID (formatted as XXXX XXXX XXXX)"
echo "   ✅ Address (textarea)"
echo "   ✅ Role (restricted to Student for teachers)"
echo "   ✅ School (automatically filtered)"
echo ""

echo "🎯 Test Instructions:"
echo "1. Open: http://localhost:5174/login"
echo "2. Login as teacher: testteacher@example.com / teacher123"
echo "3. Click 'Students' in navigation"
echo "4. Click 'Add Student' button"
echo "5. Verify all fields are present in the modal"
echo ""

echo "📊 Form Features:"
echo "   • Larger modal for more fields"
echo "   • Aadhaar ID auto-formats with spaces"
echo "   • Standard field only shows for students"
echo "   • Better field validation"
echo "   • Responsive design"
echo ""

echo "✅ Form is ready for testing!"
echo ""
echo "🌐 Quick Links:"
echo "   • Login: http://localhost:5174/login"
echo "   • Students: http://localhost:5174/members"
