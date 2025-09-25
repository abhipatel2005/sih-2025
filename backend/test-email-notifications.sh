#!/bin/bash

# Test Email Notification System
# This script tests the email notification endpoints

echo "🧪 Testing Email Notification System"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
ADMIN_TOKEN="YOUR_ADMIN_TOKEN_HERE"

# Check if server is running
echo -e "\n📡 Checking if server is running..."
if curl -s "$BASE_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running. Please start with: npm start${NC}"
    exit 1
fi

# Test low attendance check endpoint
echo -e "\n📧 Testing low attendance check..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/attendance/check-low-attendance" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Low attendance check successful${NC}"
    echo "Response: $response_body"
elif [ "$http_code" = "401" ]; then
    echo -e "${YELLOW}⚠️  Authentication required. Please update ADMIN_TOKEN in this script${NC}"
elif [ "$http_code" = "403" ]; then
    echo -e "${YELLOW}⚠️  Admin/Mentor role required${NC}"
else
    echo -e "${RED}❌ Request failed with status $http_code${NC}"
    echo "Response: $response_body"
fi

# Test auto-exit endpoint  
echo -e "\n🕚 Testing auto-exit cleanup..."
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/attendance/auto-exit" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json")

http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Auto-exit cleanup successful${NC}"
    echo "Response: $response_body"
elif [ "$http_code" = "401" ]; then
    echo -e "${YELLOW}⚠️  Authentication required${NC}"
elif [ "$http_code" = "403" ]; then
    echo -e "${YELLOW}⚠️  Admin/Mentor role required${NC}"
else
    echo -e "${RED}❌ Request failed with status $http_code${NC}"
    echo "Response: $response_body"
fi

echo -e "\n📋 Email Configuration Checklist:"
echo "================================="
echo "1. Set EMAIL_USER in .env file"
echo "2. Set EMAIL_PASS in .env file (use App Password for Gmail)"
echo "3. Set ADMIN_EMAILS in .env file (comma-separated)"
echo "4. Ensure users have valid email addresses in their profiles"
echo "5. Update ADMIN_TOKEN in this test script for authentication"

echo -e "\n📅 Scheduled Tasks:"
echo "=================="
echo "• Auto-cleanup: Daily at 10:00 PM IST"
echo "• Low attendance check: Daily at 11:00 PM IST"

echo -e "\n📧 To test email delivery:"
echo "========================="
echo "1. Ensure email configuration is complete"
echo "2. Create test users with email addresses"
echo "3. Create attendance records with < 2 hours"
echo "4. Run: curl -X POST $BASE_URL/attendance/check-low-attendance -H 'Authorization: Bearer YOUR_TOKEN'"

echo -e "\n${GREEN}🎉 Email notification system tests completed!${NC}"
