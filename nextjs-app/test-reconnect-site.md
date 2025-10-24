# Test: Reconnect Webflow Site to Verify Tokens

## Current Status
- Site ID in Xano: 8
- Webflow Site ID: 652b10ed79cbf4ed07a349ed
- Site Name: Flex Flow Web
- ❌ Tokens are currently empty strings

## Test Steps

1. **Go to your app**: http://localhost:3000/dashboard

2. **Remove the old site connection**:
   - You can delete the site from Xano database (site table, ID: 8)
   - OR disconnect it from your dashboard if there's a disconnect button

3. **Reconnect the site**:
   - Click "Connect Site" button
   - Complete the OAuth flow with Webflow
   - Authorize the app

4. **Verify in Xano**:
   - Check the site table in Xano
   - The webflow_access_token field should now have a long token string (not empty)
   - The webflow_refresh_token field should also be populated (if Webflow provides it)

## Expected Result
After reconnecting, the site record should have:
- ✅ webflow_access_token: "a1b2c3..." (long alphanumeric string)
- ✅ webflow_refresh_token: "x9y8z7..." (if provided by Webflow)

## If Still Not Working
Check the Next.js server logs for any errors during the OAuth callback.
