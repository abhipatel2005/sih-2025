#!/bin/bash

# Test script for multiple session functionality
echo "Testing Multiple Session Attendance System"
echo "=========================================="

BASE_URL="http://localhost:3000"

# Test RFID tag (you should replace this with an actual RFID tag from your system)
TEST_RFID="test_rfid_001"

echo "1. First Entry (Session 1 Start)"
curl -X POST $BASE_URL/attendance \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  -w "\nStatus: %{http_code}\n\n"

sleep 2

echo "2. First Exit (Session 1 End)"
curl -X POST $BASE_URL/attendance \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  -w "\nStatus: %{http_code}\n\n"

sleep 2

echo "3. Second Entry (Session 2 Start)"
curl -X POST $BASE_URL/attendance \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  -w "\nStatus: %{http_code}\n\n"

sleep 2

echo "4. Second Exit (Session 2 End)"
curl -X POST $BASE_URL/attendance \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  -w "\nStatus: %{http_code}\n\n"

sleep 2

echo "5. Third Entry (Session 3 Start - will remain open for auto-exit test)"
curl -X POST $BASE_URL/attendance \
  -H "Content-Type: application/json" \
  -d "{\"rfidTag\":\"$TEST_RFID\"}" \
  -w "\nStatus: %{http_code}\n\n"

echo "6. Check today's attendance"
curl -X GET $BASE_URL/attendance/today \
  -w "\nStatus: %{http_code}\n\n"

echo "=========================================="
echo "Test completed!"
echo "Note: The third session should remain open (no exit time)"
echo "You can test the auto-exit functionality by running:"
echo "npm run auto-exit"
echo "or by waiting until 9 PM for the automatic scheduled run"
