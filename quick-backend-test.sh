#!/bin/bash

# Simple test to see if backend starts and teacher endpoints work
echo "🧪 Testing if backend starts and basic teacher endpoints work..."

cd /Users/yashdarji/Workspace/sih-2025/backend

echo "Starting backend server in background..."
npm start > server.log 2>&1 &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

echo "Testing basic health check..."
curl -s http://localhost:3000/api-info | head -5

echo ""
echo "Testing if users table is accessible..."
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nonexistent@test.com", 
    "password": "test123"
  }' | head -1

echo ""
echo "Server log (last 10 lines):"
tail -10 server.log

echo ""
echo "Stopping server..."
kill $SERVER_PID

echo "✅ Test complete!"
