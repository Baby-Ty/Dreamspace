#!/bin/bash

# Local smoke test runner
# Tests against local dev server

echo "🚀 Starting local dev server..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Run smoke tests
echo "🧪 Running smoke tests..."
node scripts/smokeTest.cjs http://localhost:5173

# Capture exit code
TEST_EXIT_CODE=$?

# Kill dev server
echo "🛑 Stopping dev server..."
kill $SERVER_PID

# Exit with test result
exit $TEST_EXIT_CODE

