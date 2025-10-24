# Fix: Update the CORRECT Xano Endpoint

## Problem Found! 🎯

You have **TWO** POST endpoints for sites:
1. **POST `/sites`** (plural) - You edited this one, it HAS the tokens ✅
2. **POST `/site`** (singular) - The app uses THIS one, but it's MISSING the tokens ❌

## Solution

### Option 1: Update POST `/site` (Recommended)

1. Go to Xano → **Roolify Backend API**
2. Find **POST `/site`** (ID: 3031980, "Add site record")
3. Click to edit it
4. Update the Function Stack to:

```xano
db.add site {
  data = {
    created_at              : "now"
    webflow_site_id         : $input.webflow_site_id
    site_name               : $input.site_name
    user_id                 : $input.user_id
    webflow_access_token    : $input.webflow_access_token
    webflow_refresh_token   : $input.webflow_refresh_token
    token_expires_at        : $input.token_expires_at
    installed_at            : $input.installed_at
    is_active               : $input.is_active
  }
} as $model
```

5. Save the endpoint

### Option 2: Delete Old Endpoint and Change App URL (Alternative)

1. Delete the old POST `/site` endpoint
2. Rename POST `/sites` to POST `/site`
3. Or update your Next.js code to use `/sites` instead

## Test After Fix

1. Delete site record ID 10 from Xano
2. Reconnect site via OAuth
3. Check that tokens are populated

The logs already show the app is sending the tokens correctly - Xano just needs to accept them!





