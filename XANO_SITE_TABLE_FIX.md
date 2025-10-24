# CRITICAL: Xano Site Table Missing OAuth Token Fields

## Root Cause Discovered

Using the Xano MCP tools, I discovered that the `site` table in Xano is **MISSING** the following critical fields:
- `webflow_access_token` (text field for storing the OAuth access token)
- `webflow_refresh_token` (text field for storing the OAuth refresh token)

## Evidence

**Xano API Response for Site ID 11:**
```json
{
  "id": 11,
  "created_at": 1760592511456,
  "webflow_site_id": "652b10ed79cbf4ed07a349ed",
  "site_name": "Flex Flow Web",
  "user_id": 1,
  "token_expires_at": 0,
  "installed_at": 1760592511322,
  "is_active": true
}
```

**Notice:** No `webflow_access_token` or `webflow_refresh_token` fields!

**What the TypeScript interface expects (from `nextjs-app/lib/xano.ts`):**
```typescript
export interface Site {
  id?: number;
  created_at?: number;
  webflow_site_id: string;
  site_name?: string;
  user_id?: number;
  webflow_access_token?: string;    // ❌ MISSING IN XANO!
  webflow_refresh_token?: string;   // ❌ MISSING IN XANO!
  token_expires_at?: number;
  installed_at?: number;
  is_active?: boolean;
}
```

## Why OAuth Has Been Failing

The OAuth flow might actually be **partially working**, but:

1. ✅ User authorizes the app in Webflow
2. ✅ Webflow redirects with authorization code
3. ✅ App exchanges code for access token
4. ✅ Webflow returns `access_token` and `refresh_token`
5. ❌ App tries to save tokens to Xano via `xanoSites.upsert()`
6. ❌ Xano `site` table doesn't have `webflow_access_token` field
7. ❌ Tokens are not stored (silently fail or partially succeed)
8. ❌ Site exists but has no tokens
9. ❌ All Webflow API calls fail with 404

OR the OAuth redirect URI error is preventing step 3 from succeeding at all.

## Required Fix in Xano

You MUST add these two fields to the `site` table in Xano:

### Field 1: webflow_access_token
- **Type:** Text
- **Required:** No (Optional)
- **Description:** Stores the OAuth access token for Webflow API access

### Field 2: webflow_refresh_token
- **Type:** Text  
- **Required:** No (Optional)
- **Description:** Stores the OAuth refresh token for renewing expired access tokens

## How to Add Fields in Xano

1. **Go to Xano Dashboard**
2. **Navigate to Database → Tables**
3. **Click on the `site` table**
4. **Click "Add Field"** button
5. **Add field `webflow_access_token`:**
   - Name: `webflow_access_token`
   - Type: Text
   - Default: null
   - Required: No
6. **Add field `webflow_refresh_token`:**
   - Name: `webflow_refresh_token`
   - Type: Text
   - Default: null
   - Required: No
7. **Save the table**

## Verification Steps After Adding Fields

### Step 1: Verify Fields Exist

Use the Xano MCP tool to check if fields are now returned:

```bash
# This should now include webflow_access_token and webflow_refresh_token fields
curl http://localhost:3000/api/xano/test-site-fields
```

### Step 2: Test Token Storage

Try manually updating a site with tokens:

```typescript
// Via Xano MCP or API
await xanoSites.update(11, {
  webflow_access_token: "test_token_123",
  webflow_refresh_token: "test_refresh_456",
  token_expires_at: Date.now() + 86400000, // 24 hours from now
});
```

### Step 3: Verify Token Retrieval

```typescript
const site = await xanoSites.getById(11);
console.log(site.webflow_access_token); // Should log "test_token_123"
```

### Step 4: Delete Test Sites and Retry OAuth

Once fields are added:

1. Delete sites ID 11 and 13 from Xano (they have no tokens anyway)
2. Clear browser cookies for webflow.com
3. Try OAuth flow again with a fresh site installation
4. Check if tokens are now being stored

## Expected Outcome After Fix

Once the fields are added to Xano:

1. ✅ OAuth authorization succeeds
2. ✅ App exchanges code for tokens
3. ✅ App stores tokens in Xano `site` table
4. ✅ `webflow_access_token` field contains the access token
5. ✅ `webflow_refresh_token` field contains the refresh token
6. ✅ `token_expires_at` contains the expiration timestamp
7. ✅ All Webflow API calls work (forms, pages, collections)
8. ✅ Dashboard displays data correctly

## Why This Was Missed

During the Xano migration, the `site` table was likely created with only the basic fields visible in the MCP response:
- `id`
- `created_at`
- `webflow_site_id`
- `site_name`
- `user_id`
- `token_expires_at`
- `installed_at`
- `is_active`

But the OAuth token fields (`webflow_access_token`, `webflow_refresh_token`) were never added to the schema, even though the TypeScript code expects them.

## Alternative: Check if Fields Exist but Are Hidden

It's also possible the fields exist in Xano but are configured to be hidden from API responses. Check:

1. Go to Xano Database → `site` table
2. Look at the field list
3. Check if `webflow_access_token` and `webflow_refresh_token` exist
4. If they exist, check the API endpoint configuration:
   - Go to API → `/site/{site_id}` endpoint
   - Check the "Response" section
   - Ensure `webflow_access_token` and `webflow_refresh_token` are included in the response

## This Explains Everything

- ✅ Why sites exist in Xano but have no tokens
- ✅ Why `token_expires_at` is always 0
- ✅ Why all Webflow API calls return 404
- ✅ Why forms/pages/activity don't load
- ✅ Why OAuth "succeeds" but data doesn't work

The OAuth redirect URI error might be a red herring - the real issue is that even if OAuth succeeded, the tokens couldn't be stored because the fields don't exist!

## Action Required

**YOU MUST ADD THESE TWO FIELDS TO THE XANO `site` TABLE IMMEDIATELY:**
1. `webflow_access_token` (text field)
2. `webflow_refresh_token` (text field)

Once added, retry the OAuth flow and everything should work.

