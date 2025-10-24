#!/bin/bash

echo "🚀 Starting ngrok tunnel for Roolify app..."
echo ""

# Start ngrok in the background
ngrok http 3000 > /dev/null 2>&1 &
NGROK_PID=$!

echo "✅ Ngrok started (PID: $NGROK_PID)"
echo "⏳ Waiting for ngrok to initialize..."
sleep 4

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else '')" 2>/dev/null)

if [ -z "$NGROK_URL" ]; then
  echo "❌ Failed to get ngrok URL. Make sure ngrok is installed and authenticated."
  echo ""
  echo "To set up ngrok:"
  echo "1. Sign up at https://dashboard.ngrok.com/signup"
  echo "2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken"
  echo "3. Run: ngrok config add-authtoken YOUR_TOKEN"
  echo "4. Run this script again"
  exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Ngrok tunnel is running!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📍 Your public HTTPS URL:"
echo "   $NGROK_URL"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "⚙️  NEXT STEPS:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "1. Update .env.local with these values:"
echo "   NEXT_PUBLIC_APP_URL=$NGROK_URL"
echo "   NEXT_PUBLIC_REDIRECT_URI=$NGROK_URL/api/auth/callback"
echo ""
echo "2. Update Webflow App Settings:"
echo "   https://developers.webflow.com/"
echo "   → Your App → Settings"
echo "   → Redirect URI: $NGROK_URL/api/auth/callback"
echo ""
echo "3. Restart your Next.js server:"
echo "   cd nextjs-app && npm run dev"
echo ""
echo "4. Test OAuth flow:"
echo "   Visit: $NGROK_URL/api/auth/install"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "💡 TIP: This ngrok URL will change each time you restart."
echo "    For a permanent URL, upgrade to ngrok Pro or deploy to Vercel."
echo ""
echo "🛑 To stop ngrok: kill $NGROK_PID"
echo ""






