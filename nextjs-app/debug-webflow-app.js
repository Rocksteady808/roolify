#!/usr/bin/env node

// Debug script to test Webflow OAuth configuration
const https = require('https');

console.log('🔍 Webflow OAuth Configuration Debug');
console.log('=====================================');

// Test the exact OAuth flow that's failing
const testOAuthFlow = () => {
  console.log('\n1. Testing OAuth Authorization URL...');
  
  const oauthUrl = 'https://webflow.com/oauth/authorize?client_id=0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d&redirect_uri=https%3A%2F%2Febcc21942ec5.ngrok-free.app%2Fapi%2Fauth%2Fcallback&response_type=code&scope=sites%3Aread+forms%3Aread+pages%3Aread';
  
  console.log('🔗 OAuth URL:', oauthUrl);
  
  // Parse the URL to verify parameters
  const url = new URL(oauthUrl);
  console.log('📋 Parameters:');
  console.log('  - client_id:', url.searchParams.get('client_id'));
  console.log('  - redirect_uri:', decodeURIComponent(url.searchParams.get('redirect_uri')));
  console.log('  - response_type:', url.searchParams.get('response_type'));
  console.log('  - scope:', url.searchParams.get('scope'));
  
  // Check if redirect_uri is exactly what we expect
  const expectedRedirectUri = 'https://ebcc21942ec5.ngrok-free.app/api/auth/callback';
  const actualRedirectUri = decodeURIComponent(url.searchParams.get('redirect_uri'));
  
  if (actualRedirectUri === expectedRedirectUri) {
    console.log('✅ Redirect URI matches expected value');
  } else {
    console.log('❌ Redirect URI mismatch!');
    console.log('   Expected:', expectedRedirectUri);
    console.log('   Actual:  ', actualRedirectUri);
  }
};

// Test token exchange with a mock code
const testTokenExchange = () => {
  console.log('\n2. Testing Token Exchange...');
  
  const tokenUrl = 'https://api.webflow.com/oauth/access_token';
  const clientId = '0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d';
  const clientSecret = process.env.WEBFLOW_CLIENT_SECRET || 'YOUR_CLIENT_SECRET';
  const redirectUri = 'https://ebcc21942ec5.ngrok-free.app/api/auth/callback';
  
  const postData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: 'test_code_123',
    redirect_uri: redirectUri
  });
  
  console.log('🔑 Token Exchange Parameters:');
  console.log('  - grant_type: authorization_code');
  console.log('  - client_id:', clientId);
  console.log('  - client_secret: [HIDDEN]');
  console.log('  - code: test_code_123');
  console.log('  - redirect_uri:', redirectUri);
  
  const options = {
    hostname: 'api.webflow.com',
    port: 443,
    path: '/oauth/access_token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData.toString())
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      console.log('📡 Token Exchange Response:');
      console.log('  - Status:', res.statusCode);
      console.log('  - Response:', data);
      
      if (res.statusCode === 400) {
        try {
          const error = JSON.parse(data);
          if (error.error === 'invalid_redirect_uri') {
            console.log('❌ CONFIRMED: invalid_redirect_uri error');
            console.log('💡 This means your Webflow app settings still have the wrong redirect URI');
          }
        } catch (e) {
          console.log('⚠️  Could not parse error response');
        }
      }
    });
  });
  
  req.on('error', (err) => {
    console.error('❌ Token exchange request failed:', err.message);
  });
  
  req.write(postData.toString());
  req.end();
};

// Main execution
console.log('🚀 Starting Webflow OAuth Debug...\n');

testOAuthFlow();
testTokenExchange();

console.log('\n3. Next Steps:');
console.log('   - Check your Webflow app settings for multiple redirect URIs');
console.log('   - Look for "Additional Redirect URIs" or "Allowed Redirect URIs"');
console.log('   - Try resetting your Client Secret in Webflow');
console.log('   - Make sure there are no trailing spaces in the redirect URI');
console.log('   - Check if your app has different environments (dev/prod)');
