#!/bin/bash

# Test script for the upgraded attendance system
# This script tests both entry and exit functionality

API_BASE="http://localhost:3000"
TEST_RFID="TEST12345"

echo "🧪 Testing Attendee - Entry/Exit Feature"
echo "=========================================================="

# Test 1: Record entry
echo "📝 Test 1: Recording entry time..."
ENTRY_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  "$API_BASE/attendance")

echo "Entry Response: $ENTRY_RESPONSE"
echo ""

# Wait a moment
sleep 2

# Test 2: Record exit
echo "📝 Test 2: Recording exit time..."
EXIT_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  "$API_BASE/attendance")

echo "Exit Response: $EXIT_RESPONSE"
echo ""

# Test 3: Try recording again (should get "already logged" message)
echo "📝 Test 3: Attempting to record again (should be rejected)..."
DUPLICATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  "$API_BASE/attendance")

echo "Duplicate Response: $DUPLICATE_RESPONSE"
echo ""

# Test 4: Get today's attendance
echo "📝 Test 4: Getting today's attendance..."
TODAY_RESPONSE=$(curl -s -X GET "$API_BASE/attendance/today")
echo "Today's Attendance: $TODAY_RESPONSE"
echo ""

# Test 5: Health check
echo "📝 Test 5: Health check..."
HEALTH_RESPONSE=$(curl -s -X GET "$API_BASE/health")
echo "Health: $HEALTH_RESPONSE"
echo ""

echo "✅ Test completed!"
echo ""
echo "💡 Expected behavior:"
echo "   - First call should record entry time"
echo "   - Second call should record exit time"
echo "   - Third call should return 'already logged' message"
echo "   - Today's attendance should show both entry and exit times"
