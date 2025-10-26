# Roolify Fix Summary - Authentication & Select Options

## Issues Fixed

### 1. Auth JSON Parse Error ✅
**Error**: `Auth error: SyntaxError: Unexpected end of JSON input`
**File**: `nextjs-app/app/api/form-rules/form/[formId]/route.ts`
**Fix**: Removed local `getCurrentUserId()` function and imported from `@/lib/serverAuth`
- All calls to `getCurrentUserId()` now pass the request object as parameter
- Fixed in GET, POST, DELETE, and PUT handlers

### 2. Missing Auth Tokens in Server Requests ✅
**Error**: `[Xano Request] Has token: false`
**File**: `nextjs-app/lib/xano.ts`
**Fix**: Improved server-side auth handling in `xanoRequest()`
- Now prioritizes `XANO_API_TOKEN` environment variable for server-side requests
- Added better logging to show which auth method is used
- Shows "API token (server-side)" vs "User token (client-side)"

### 3. Webflow 401 Errors ✅
**Error**: `Webflow API error: 401`
**File**: `nextjs-app/lib/webflowStore.ts` + `nextjs-app/app/api/webflow/refresh-token/route.ts`
**Fix**: Implemented token refresh mechanism
- Added `refreshWebflowToken()` function that calls Webflow OAuth API
- Updated `getTokenForSite()` to automatically refresh expired tokens
- Added 5-minute buffer before token expiration
- Created `/api/webflow/refresh-token` endpoint for manual refresh

### 4. Select Field Options Not Showing ✅
**Error**: HBI Account Rep and other select fields missing options
**File**: `nextjs-app/app/api/forms/dynamic-options/route.ts`
**Fix**: Added token refresh retry logic on 401 errors
- All Webflow API calls now use `tokenRecord.token` instead of raw token string
- On 401 response, automatically refreshes token and retries request once
- Applied to Designer API, CMS API, and site info API calls

## Files Modified

1. ✅ `nextjs-app/app/api/form-rules/form/[formId]/route.ts` - Fixed auth imports
2. ✅ `nextjs-app/lib/xano.ts` - Improved server-side auth handling
3. ✅ `nextjs-app/lib/webflowStore.ts` - Added token refresh logic
4. ✅ `nextjs-app/app/api/webflow/refresh-token/route.ts` - NEW - Token refresh endpoint
5. ✅ `nextjs-app/app/api/forms/dynamic-options/route.ts` - Added retry with token refresh on 401

## Environment Variables Needed

Add to `.env.local`:

```bash
# Required for server-side Xano API calls
XANO_API_TOKEN=<your_xano_admin_token>

# Required for Webflow token refresh
WEBFLOW_CLIENT_ID=<your_webflow_client_id>
WEBFLOW_CLIENT_SECRET=<your_webflow_client_secret>
```

## Testing Checklist

- [ ] No `Auth error: SyntaxError` in logs
- [ ] No `Webflow API error: 401` in logs
- [ ] Xano requests show `Auth: API token (server-side)` or `Auth: User token`
- [ ] HBI Account Rep field shows all options (Aaron, Brian, Cameron, etc.)
- [ ] All other select fields show their options correctly
- [ ] Rules can be created and saved
- [ ] Notifications can be configured with conditional routing

## Token Refresh Flow

1. `getTokenForSite()` is called
2. Checks if token is expired (with 5-min buffer)
3. If expired, calls `refreshWebflowToken()`
4. Refresh fetches new token from Webflow OAuth API
5. Updates Xano database with new token and expiration
6. Returns fresh token

## 401 Error Recovery

1. Webflow API call receives 401 response
2. Automatically calls `refreshWebflowToken()` to get new token
3. Retries the original request with fresh token
4. If retry succeeds, proceeds normally
5. If retry fails, falls back to next strategy (page scanning, etc.)

## Next Steps for User

### For Netlify Deployment

1. **Add Environment Variables in Netlify Dashboard**
   - Go to: https://app.netlify.com → Your Site → Site settings → Environment variables
   - Add these variables (one at a time):

   ```bash
   # Xano (Required for server-side API calls)
   XANO_API_TOKEN=<your_xano_admin_token>
   
   # Webflow OAuth (Required for token refresh)
   WEBFLOW_CLIENT_ID=<your_webflow_client_id>
   WEBFLOW_CLIENT_SECRET=<your_webflow_client_secret>
   
   # Xano Base URLs (Already set, just verify)
   NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://x1zj-piqu-kkh1.n7e.xano.io/api:pU92d7fv
   NEXT_PUBLIC_XANO_API_BASE_URL=https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj
   ```

2. **Get Your Credentials**
   - **XANO_API_TOKEN**: Go to Xano Dashboard → Settings → API Management → Generate API Token
   - **WEBFLOW_CLIENT_ID**: From your Webflow Developer app settings
   - **WEBFLOW_CLIENT_SECRET**: From your Webflow Developer app settings

3. **Redeploy Your Site**
   - Go to: Netlify Dashboard → Deployments → Trigger deploy → Deploy site
   - OR push a new commit to trigger automatic deployment

4. **Monitor Logs**
   - Go to: Netlify Dashboard → Functions → View logs
   - Check for:
     - ✅ No more `Auth error: SyntaxError`
     - ✅ No more `Webflow API error: 401`
     - ✅ `Auth: API token (server-side)` or `Auth: User token` in logs

5. **Test Your App**
   - Visit your Netlify app URL
   - Test rule builder - verify HBI Account Rep shows all options
   - Test notifications page - verify select fields show options
   - Create and save a rule
   - Configure notifications with conditional routing
