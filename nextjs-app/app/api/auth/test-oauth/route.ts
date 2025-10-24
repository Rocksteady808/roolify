import { NextResponse } from 'next/server';

export async function GET() {
  const redirectUri = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
  
  // Test the exact OAuth flow
  const params = new URLSearchParams({
    client_id: process.env.WEBFLOW_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "sites:read forms:read pages:read",
  });

  const authorizeUrl = `https://webflow.com/oauth/authorize?${params.toString()}`;
  
  const debugInfo = {
    redirectUri: redirectUri,
    redirectUriBytes: Array.from(redirectUri).map(c => c.charCodeAt(0)),
    redirectUriLength: redirectUri.length,
    clientId: process.env.WEBFLOW_CLIENT_ID,
    authorizeUrl: authorizeUrl,
    params: {
      client_id: process.env.WEBFLOW_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "sites:read forms:read pages:read",
    }
  };
  
  return NextResponse.json(debugInfo);
}