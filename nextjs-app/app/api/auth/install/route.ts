import { NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/serverAuth';

const CLIENT_ID = process.env.WEBFLOW_CLIENT_ID;
const REDIRECT_URI = process.env.REDIRECT_URI || process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

export async function GET() {
  if (!CLIENT_ID) {
    return NextResponse.json({ error: "Client ID not configured" }, { status: 500 });
  }

  // Check if user is authenticated
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.redirect(new URL('/login', process.env.APP_URL || 'http://localhost:3000'));
  }

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "sites:read forms:read pages:read",
  });

  const authorizeUrl = `https://webflow.com/oauth/authorize?${params.toString()}`;
  
  console.log("=== OAuth Install Debug ===");
  console.log("Redirect URI:", REDIRECT_URI);
  console.log("Client ID:", CLIENT_ID);
  console.log("Full authorize URL:", authorizeUrl);
  console.log("========================");
  
  return NextResponse.redirect(authorizeUrl);
}
