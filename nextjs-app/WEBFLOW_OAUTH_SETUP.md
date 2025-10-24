# Webflow OAuth Setup Guide

## Quick Start

Follow these steps to install your app on different Webflow sites.

---

## Step 1: Update Your Webflow App Settings

1. Go to **Webflow Developer Portal**: https://developers.webflow.com/
2. Find your app and click **"Edit"**
3. Update the **Redirect URI** to:
   ```
   http://localhost:1337/api/auth/callback
   ```
4. **Save** your changes

---

## Step 2: Add OAuth Credentials to Your App

1. In the same Webflow app settings, copy your:
   - **Client ID**
   - **Client Secret** (click "Show" to reveal it)

2. Open or create `nextjs-app/.env.local` and add:

```bash
# Webflow OAuth Credentials
WEBFLOW_CLIENT_ID=your_client_id_here
WEBFLOW_CLIENT_SECRET=your_client_secret_here

# Xano API URLs
NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj
NEXT_PUBLIC_XANO_API_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:1337
```

3. **Replace** `your_client_id_here` and `your_client_secret_here` with your actual credentials

---

## Step 3: Restart Your Server

After adding the credentials, restart your Next.js app:

```bash
cd nextjs-app
npm run dev
```

---

## Step 4: Install on a New Site

1. In Webflow, go to your site **Settings** → **Apps**
2. Find your app and click **"Install"**
3. You'll be redirected to the OAuth authorization page
4. Click **"Authorize"**
5. You'll be redirected back to your dashboard

---

## Troubleshooting

### Error: "OAuth credentials not configured"

✅ Make sure you created `.env.local` with valid credentials  
✅ Make sure you restarted the server after adding credentials  
✅ Check that the file is in `nextjs-app/.env.local` (not the root)

### Error: "Redirect URI mismatch"

✅ Make sure your Webflow app's Redirect URI is set to:  
   `http://localhost:1337/api/auth/callback`

### Still not working?

Check the terminal logs for detailed error messages. The OAuth callback will log:
- The authorization code
- Token exchange details
- Any API errors

---

## What Changed?

1. ✅ Fixed redirect URI to use port **1337** (instead of 3000)
2. ✅ Added environment variable support for OAuth credentials
3. ✅ Dashboard redirect now uses port **1337**

---

## Security Note

⚠️ **Never commit your `.env.local` file to Git!**

The `.env.local` file is already in `.gitignore`, but always double-check before pushing code.








