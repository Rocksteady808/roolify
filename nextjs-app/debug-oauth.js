#!/usr/bin/env node

/**
 * OAuth Debug Script
 * This script checks the exact URLs being used in the OAuth flow
 */

const BASE_URL = 'https://ebcc21942ec5.ngrok-free.app';

async function debugOAuth() {
  console.log('🔍 OAuth Debug Analysis\n');

  try {
    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}`);
    console.log(`NEXT_PUBLIC_REDIRECT_URI: ${process.env.NEXT_PUBLIC_REDIRECT_URI || 'NOT SET'}`);
    console.log(`WEBFLOW_CLIENT_ID: ${process.env.WEBFLOW_CLIENT_ID ? 'SET' : 'NOT SET'}`);
    console.log(`WEBFLOW_CLIENT_SECRET: ${process.env.WEBFLOW_CLIENT_SECRET ? 'SET' : 'NOT SET'}\n`);

    // Test install endpoint
    console.log('🔗 Testing Install Endpoint:');
    const installResponse = await fetch(`${BASE_URL}/api/auth/install`, {
      method: 'GET',
      redirect: 'manual' // Don't follow redirects
    });
    
    console.log(`Status: ${installResponse.status}`);
    console.log(`Headers:`, Object.fromEntries(installResponse.headers.entries()));
    
    if (installResponse.status === 302) {
      const location = installResponse.headers.get('location');
      console.log(`Redirect URL: ${location}`);
      
      if (location) {
        const url = new URL(location);
        const redirectUri = url.searchParams.get('redirect_uri');
        console.log(`Redirect URI in OAuth URL: ${redirectUri}`);
      }
    }

    // Test callback endpoint
    console.log('\n🔄 Testing Callback Endpoint:');
    const callbackResponse = await fetch(`${BASE_URL}/api/auth/callback?code=test123`);
    console.log(`Status: ${callbackResponse.status}`);
    
    if (!callbackResponse.ok) {
      const errorText = await callbackResponse.text();
      console.log(`Error: ${errorText}`);
    }

    console.log('\n🎯 Analysis:');
    console.log('1. Check if your Webflow app settings match the redirect URI above');
    console.log('2. The redirect URI should be: https://ebcc21942ec5.ngrok-free.app/api/auth/callback');
    console.log('3. Make sure there are no extra spaces or characters in Webflow settings');
    console.log('4. Try clearing browser cache and starting a fresh OAuth flow');

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugOAuth();


