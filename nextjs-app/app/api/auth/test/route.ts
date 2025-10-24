import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.WEBFLOW_CLIENT_ID;
const CLIENT_SECRET = process.env.WEBFLOW_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI || "http://localhost:1337/api/auth/callback";

export async function GET() {
  return NextResponse.json({
    client_id: CLIENT_ID,
    client_secret_set: !!CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    expected_authorize_url: `https://webflow.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=sites:read+forms:read+pages:read`,
    instructions: {
      step1: "Copy the redirect_uri value above",
      step2: "Go to your Webflow app settings",
      step3: "Delete the existing redirect URI",
      step4: "Paste it again and click Save",
      step5: "Make sure OAuth scopes include: sites:read, forms:read, pages:read",
      step6: "Try installing again at /api/auth/install"
    }
  });
}












