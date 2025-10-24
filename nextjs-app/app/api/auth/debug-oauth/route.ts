import { NextResponse } from 'next/server';

export async function GET() {
  const installRedirectUri = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
  const callbackRedirectUri = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
  
  const debugInfo = {
    install: {
      redirectUri: installRedirectUri,
      clientId: process.env.WEBFLOW_CLIENT_ID,
      hasClientId: !!process.env.WEBFLOW_CLIENT_ID,
    },
    callback: {
      redirectUri: callbackRedirectUri,
      clientId: process.env.WEBFLOW_CLIENT_ID,
      clientSecret: process.env.WEBFLOW_CLIENT_SECRET,
      hasClientId: !!process.env.WEBFLOW_CLIENT_ID,
      hasClientSecret: !!process.env.WEBFLOW_CLIENT_SECRET,
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      REDIRECT_URI: process.env.REDIRECT_URI,
      NEXT_PUBLIC_REDIRECT_URI: process.env.NEXT_PUBLIC_REDIRECT_URI,
    }
  };
  
  return NextResponse.json(debugInfo);
}