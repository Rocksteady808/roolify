# Webflow OAuth Issue - Complete Diagnosis

## Current Status ❌

**Problem:** OAuth token exchange consistently fails with `invalid_redirect_uri` error despite:
- ✅ Redirect URI matching exactly: `http://localhost:3000/api/auth/callback`
- ✅ Client ID and Secret configured correctly
- ✅ Environment variables loaded properly
- ✅ Both install and callback routes using same URI

**Error from Webflow:**
```json
{"error":"invalid_grant","error_description":"invalid_redirect_uri"}
```

## Root Cause Analysis

After implementing all standard fixes, this error persisting suggests ONE of these scenarios:

### Scenario 1: Webflow App Type Mismatch ⚠️ MOST LIKELY

**Problem:** You may have created a "Designer Extension" app instead of a "Data Client" app.

**Why This Matters:**
- **Designer Extensions** run INSIDE Webflow Designer (on port 1337) and use different OAuth flows
- **Data Clients** are standalone apps that connect TO Webflow sites (your use case)

**How to Check:**
1. Go to https://developers.webflow.com/
2. Click on your app
3. Look for the app type - it should say "Data Client" NOT "Designer Extension"

**Solution if Wrong Type:**
You MUST create a NEW app as a "Data Client":
1. Go to https://developers.webflow.com/
2. Click "Create New App"  
3. Choose "Data Client" (not Designer Extension)
4. Set redirect URI to: `http://localhost:3000/api/auth/callback`
5. Copy the new Client ID and Secret to your `.env.local`

### Scenario 2: Multiple Redirect URIs Configured

**Problem:** Webflow app has multiple redirect URIs and is using the wrong one.

**How to Check:**
1. Go to your Webflow app settings
2. Look at the "Redirect URIs" section
3. You should have ONLY ONE: `http://localhost:3000/api/auth/callback`

**Solution:**
- Remove ALL other redirect URIs
- Keep only: `http://localhost:3000/api/auth/callback`
- Save and wait 5 minutes for Webflow's cache to clear

### Scenario 3: Webflow Authorization Cache

**Problem:** The authorization codes being generated are for an OLD redirect URI configuration.

**Solution:**
1. Clear your browser cookies for webflow.com
2. Use incognito/private browsing window
3. Try OAuth flow again with fresh authorization request

### Scenario 4: Trailing Slash Mismatch

**Problem:** Webflow might be adding or removing a trailing slash.

**Test:** Use the new debug endpoint:
```bash
curl http://localhost:3000/api/auth/force-install-log
```

Try these variations:
- With slash: `http://localhost:3000/api/auth/callback/`
- Without slash: `http://localhost:3000/api/auth/callback`

**Solution:** Update Webflow app settings to match the EXACT format that works.

### Scenario 5: HTTPS Required (Development Mode Issue)

**Problem:** Some Webflow app configurations require HTTPS even for localhost.

**How to Check:** Look at your Webflow app settings for any mention of "production only" or "HTTPS required".

**Solution:** You would need to either:
- Use a tool like ngrok to create an HTTPS tunnel
- OR configure the Webflow app to allow HTTP for development

## Immediate Next Steps

### Step 1: Verify Webflow App Type 🎯 DO THIS FIRST

1. Go to https://developers.webflow.com/
2. Find your app with Client ID: `0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d`
3. Check if it says "Data Client" or "Designer Extension"
4. **If it's a Designer Extension:** You MUST create a new app as "Data Client"

### Step 2: Screenshot Your Webflow App Settings

Take screenshots of:
1. App type/category
2. All redirect URIs configured
3. OAuth scopes selected
4. Any special settings or restrictions

### Step 3: Test with Trailing Slash

Try adding a trailing slash to the redirect URI:

**In `.env.local`:**
```bash
REDIRECT_URI=http://localhost:3000/api/auth/callback/
```

**In Webflow app settings:**
```
http://localhost:3000/api/auth/callback/
```

Restart server and try again.

### Step 4: Try Fresh Authorization (Clear Cache)

1. Close all browser tabs
2. Clear cookies for webflow.com
3. Open incognito/private window
4. Try OAuth flow again

### Step 5: Check Webflow App Scopes

Ensure your Webflow app has these scopes enabled:
- ✅ `sites:read`
- ✅ `forms:read`  
- ✅ `pages:read`

## Alternative: Manual Token Entry (Temporary Workaround)

While debugging, you can manually get a token from Webflow:

1. **Get Token from Webflow OAuth Playground:**
   - Go to https://developers.webflow.com/
   - Use their OAuth testing tools
   - Get a valid access token

2. **Manually Update Xano:**
   - Use Xano dashboard
   - Update site ID 11 or 13
   - Paste the access token into `webflow_access_token` field
   - Set `token_expires_at` to a future timestamp (e.g., `1777777777000`)

3. **Test Data Access:**
   - Your app should now be able to fetch forms/pages
   - This proves the data flow works
   - Confirms the issue is ONLY with OAuth setup

## Common Webflow OAuth Gotchas

1. **App Not Published:** Ensure your Webflow app is in "Development" mode (it allows localhost)
2. **Site Not Authorized:** Some Webflow apps require the site owner to authorize the app first
3. **Workspace Permissions:** The user installing must have appropriate Webflow workspace permissions
4. **API Version:** Webflow has v1 and v2 APIs - ensure you're using the right endpoints

## Questions to Answer

Please provide:

1. **What type of Webflow app do you have?**
   - [ ] Data Client
   - [ ] Designer Extension  
   - [ ] Not sure

2. **Screenshot your Webflow app settings showing:**
   - App type
   - Redirect URIs configured
   - OAuth scopes

3. **Have you tried:**
   - [ ] Clearing browser cookies
   - [ ] Using incognito mode
   - [ ] Adding/removing trailing slash
   - [ ] Creating a fresh Webflow app

## Expected Behavior (When Working)

```
User clicks "Install Site"
  ↓
App redirects to Webflow authorization page
  ↓
User approves access
  ↓
Webflow redirects to: http://localhost:3000/api/auth/callback?code=ABC123
  ↓
App exchanges code for access_token
  ↓
App stores token in Xano
  ↓
Dashboard shows forms/pages data ✅
```

## Current Behavior (Not Working)

```
User clicks "Install Site"
  ↓
App redirects to Webflow authorization page
  ↓
User approves access
  ↓
Webflow redirects to: http://localhost:3000/api/auth/callback?code=ABC123
  ↓
App tries to exchange code for access_token
  ↓
Webflow rejects with: invalid_redirect_uri ❌
  ↓
No token stored
  ↓
Dashboard shows no data
```

## Technical Details for Reference

**Working Config (verified):**
- Client ID: `0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d`
- Redirect URI: `http://localhost:3000/api/auth/callback`
- Token Exchange URL: `https://api.webflow.com/oauth/access_token`
- Auth URL: `https://webflow.com/oauth/authorize`

**Environment Variables (confirmed loaded):**
- ✅ `REDIRECT_URI=http://localhost:3000/api/auth/callback`
- ✅ `APP_URL=http://localhost:3000`
- ✅ `WEBFLOW_CLIENT_ID` set
- ✅ `WEBFLOW_CLIENT_SECRET` set

The configuration on the Next.js app side is PERFECT. The issue is with the Webflow app configuration itself.

