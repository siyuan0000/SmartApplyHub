#!/bin/bash

echo "🚀 AI Service Fix - Restart and Test Script"
echo "============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Current Status:"
echo "  - Project directory: $(pwd)"
echo "  - Package.json: ✅ Found"
echo "  - .env.local: $(if [ -f ".env.local" ]; then echo "✅ Found"; else echo "❌ Missing"; fi)"
echo ""

# Check if dev server is running
if pgrep -f "next dev" > /dev/null; then
    echo "🔄 Development server is running. Stopping it..."
    pkill -f "next dev"
    sleep 2
    echo "✅ Development server stopped"
else
    echo "ℹ️  Development server is not running"
fi

echo ""
echo "🧪 Testing environment variables..."
node scripts/test-env-loading.js

echo ""
echo "🚀 Starting development server..."
echo "  - The server will start in the background"
echo "  - Check the console for AI provider initialization messages"
echo "  - Look for messages like: 'Initialized X AI providers'"
echo ""

# Start dev server in background
npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

echo "📝 Development server started (PID: $DEV_PID)"
echo "📋 Logs are being written to: dev-server.log"
echo ""

# Wait a bit for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server started successfully
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running at http://localhost:3000"
else
    echo "❌ Server failed to start. Check dev-server.log for details"
    exit 1
fi

echo ""
echo "🔍 Testing AI service configuration..."
echo "  - Check: http://localhost:3000/api/debug/env"
echo "  - This will show if environment variables are loaded"

# Test the debug endpoint
echo ""
echo "📊 Debug endpoint response:"
curl -s http://localhost:3000/api/debug/env | jq '.' 2>/dev/null || curl -s http://localhost:3000/api/debug/env

echo ""
echo "🎯 Next Steps:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Try to generate an About section"
echo "  3. Check the browser console for any errors"
echo "  4. Look for AI provider initialization messages in the terminal"
echo ""
echo "📋 To monitor the server logs:"
echo "  tail -f dev-server.log"
echo ""
echo "🛑 To stop the server:"
echo "  kill $DEV_PID"
echo ""
echo "✨ The AI service should now work properly or provide helpful fallback messages!" 