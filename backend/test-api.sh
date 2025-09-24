#!/bin/bash

# Test script for the Attendee MVP system
# This script helps you test the API endpoints

echo "🧪 Attendee MVP - API Test Script"
echo "=================================="

# Backend URL
BACKEND_URL="http://localhost:3000"

echo ""
echo "📋 Testing GET /attendance/today..."
echo "URL: $BACKEND_URL/attendance/today"
echo ""

# Test the attendance endpoint
response=$(curl -s -w "HTTP_STATUS:%{http_code}" $BACKEND_URL/attendance/today 2>/dev/null)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')
status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)

if [ "$status" = "200" ]; then
    echo "✅ Status: $status (Success)"
    echo "📄 Response:"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo "❌ Status: $status (Error)"
    echo "Response: $body"
fi

echo ""
echo "📝 To manually test POST /attendance endpoint:"
echo "=============================================="
echo ""
echo "# Test with John Doe's RFID tag:"
echo "curl -X POST $BACKEND_URL/attendance \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"rfidTag\": \"04A1B2C3\","
echo "    \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\""
echo "  }'"
echo ""
echo "# Test with Jane Smith's RFID tag:"
echo "curl -X POST $BACKEND_URL/attendance \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"rfidTag\": \"05B2C3D4\","
echo "    \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\""
echo "  }'"
echo ""
echo "# Test with invalid RFID tag (should return 404):"
echo "curl -X POST $BACKEND_URL/attendance \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{"
echo "    \"rfidTag\": \"INVALID123\","
echo "    \"timestamp\": \"$(date '+%Y-%m-%d %H:%M:%S')\""
echo "  }'"
echo ""
echo "🌐 Frontend URL: http://localhost:5173"
echo "🔧 Backend URL: http://localhost:3000"
echo ""
echo "📚 Available RFID tags for testing:"
echo "   • John Doe: 04A1B2C3"
echo "   • Jane Smith: 05B2C3D4"
echo "   • Bob Johnson: 06C3D4E5"
echo "   • Alice Brown: 07D4E5F6"
echo "   • Charlie Wilson: 08E5F6A7"
echo "   • Diana Davis: 09F6A7B8"
echo "   • Eve Miller: 0AA7B8C9"
echo "   • Frank Garcia: 0BB8C9DA"
