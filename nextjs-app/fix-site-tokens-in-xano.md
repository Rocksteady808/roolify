# Fix: Webflow Tokens Not Saving to Xano

## Problem
The Webflow access token and refresh token are not being saved to Xano's `site` table, even though the OAuth callback is correctly sending them.

## Root Cause
The Xano **POST `/site`** endpoint has a **hardcoded data object** that does NOT include the token fields:

```
query site verb=POST {
  description = "Add site record"
  input {
    dblink {
      dbtable = "site"
    }
  }

  stack {
    db.add site {
      data = {
        created_at      : "now"
        webflow_site_id : $input.webflow_site_id
        site_name       : $input.site_name
        user_id         : $input.user_id
        token_expires_at: $input.token_expires_at
        installed_at    : $input.installed_at
        is_active       : $input.is_active
      }
    } as $model
  }

  response {
    value = $model
  }

  history = {inherit: true}
}
```

**Missing fields:**
- `webflow_access_token`
- `webflow_refresh_token`

## Solution
You need to update the Xano POST endpoint to include these fields:

### Steps to Fix in Xano UI:

1. Open Xano workspace: **Form Builder and Management Platform**
2. Navigate to: **APIs** → **Roolify Backend API**
3. Find endpoint: **POST `/site`** (ID: 3031980)
4. Click on it to edit
5. Update the `db.add site { data = {...} }` block to:

```
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

6. **Save** the endpoint
7. **Test** by reconnecting a Webflow site via OAuth

### Also Check PATCH Endpoint
The **PATCH `/site/{site_id}`** endpoint uses a dynamic approach (`$input|pick:($raw_input|keys)`), so it should already work. But verify it accepts the token fields.

## Verification
After fixing, run:
```bash
cd nextjs-app
curl -X GET "https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj/site"
```

Look for the site record - `webflow_access_token` and `webflow_refresh_token` should now have values.

## Alternative: Use PATCH Instead of POST
If you can't modify the Xano endpoint immediately, you could update the application code to:
1. Create the site with POST (partial data)
2. Immediately PATCH to add the tokens

But **fixing the Xano endpoint is the proper solution**.





