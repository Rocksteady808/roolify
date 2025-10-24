import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.WEBFLOW_CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testUri = url.searchParams.get("test_uri");
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID!,
    redirect_uri: testUri || REDIRECT_URI,
    response_type: "code",
    scope: "sites:read forms:read pages:read",
  });

  const authorizeUrl = `https://webflow.com/oauth/authorize?${params.toString()}`;
  
  return NextResponse.json({
    message: "OAuth Install Configuration",
    redirect_uri_used: testUri || REDIRECT_URI,
    authorization_url: authorizeUrl,
    instructions: [
      "1. Copy the authorization_url below",
      "2. Paste it in a new browser tab",
      "3. Complete the Webflow authorization",
      "4. Note: This will use the EXACT redirect URI shown above",
      "5. If it fails, try with ?test_uri=YOUR_URI parameter"
    ],
    testing_urls: {
      with_slash: `${req.url}?test_uri=${encodeURIComponent('http://localhost:3000/api/auth/callback/')}`,
      without_slash: `${req.url}?test_uri=${encodeURIComponent('http://localhost:3000/api/auth/callback')}`,
      https: `${req.url}?test_uri=${encodeURIComponent('https://localhost:3000/api/auth/callback')}`,
    }
  });
}

