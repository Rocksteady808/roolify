#!/usr/bin/env node

// Debug script to test OAuth flow step by step
const https = require('https');

console.log('🔍 OAuth Debug Script');
console.log('==================');

// Test 1: Check if our app is generating the correct OAuth URL
console.log('\n1. Testing OAuth URL generation...');
const testUrl = 'https://ebcc21942ec5.ngrok-free.app/api/auth/install';

https.get(testUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ App is running and generating OAuth URLs');
    console.log('📍 OAuth URL:', res.headers.location);
    
    // Extract redirect_uri from the OAuth URL
    const oauthUrl = res.headers.location;
    const urlParams = new URL(oauthUrl);
    const redirectUri = urlParams.searchParams.get('redirect_uri');
    
    console.log('🔗 Redirect URI being sent to Webflow:', redirectUri);
    console.log('🎯 Expected Redirect URI:', 'https://ebcc21942ec5.ngrok-free.app/api/auth/callback');
    
    if (redirectUri === 'https://ebcc21942ec5.ngrok-free.app/api/auth/callback') {
      console.log('✅ Redirect URI matches expected value');
    } else {
      console.log('❌ Redirect URI does NOT match expected value');
    }
  });
}).on('error', (err) => {
  console.error('❌ Error testing OAuth URL:', err.message);
});

// Test 2: Check if we can reach the callback endpoint directly
console.log('\n2. Testing callback endpoint...');
const callbackUrl = 'https://ebcc21942ec5.ngrok-free.app/api/auth/callback';

https.get(callbackUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('✅ Callback endpoint is accessible');
    console.log('📄 Response:', data.substring(0, 200) + '...');
  });
}).on('error', (err) => {
  console.error('❌ Error testing callback endpoint:', err.message);
});

console.log('\n3. Next steps:');
console.log('   - Make sure your Webflow app settings have the EXACT redirect URI:');
console.log('     https://ebcc21942ec5.ngrok-free.app/api/auth/callback');
console.log('   - Try the OAuth flow in a new incognito window');
console.log('   - Select a DIFFERENT site than before');


