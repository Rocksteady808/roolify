# 🚀 Deploy to Vercel - Multi-Site OAuth Fix

## Quick Deploy Steps

### 1. **Install Vercel CLI**
```bash
npm i -g vercel
```

### 2. **Deploy Your App**
```bash
cd nextjs-app
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **What's your project's name?** → `roolify-app` (or your choice)
- **In which directory is your code located?** → `./` (current directory)

### 3. **Set Environment Variables**

After deployment, go to your Vercel dashboard and add these environment variables:

```
WEBFLOW_CLIENT_ID=0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d
WEBFLOW_CLIENT_SECRET=your_actual_client_secret_here
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
```

### 4. **Update Webflow App Settings**

In your Webflow app settings, change the **Redirect URI** from:
```
http://localhost:1337/api/auth/callback
```

To your Vercel URL:
```
https://your-app.vercel.app/api/auth/callback
```

### 5. **Test Multi-Site Installation**

1. **Visit your Vercel app**: `https://your-app.vercel.app`
2. **Click "Connect to Webflow"**
3. **Authorize for multiple sites**
4. **Verify dashboard shows all sites**

## ✅ What's Fixed

- ✅ **OAuth redirects** now use production URLs
- ✅ **Script URLs** now use production URLs  
- ✅ **API calls** now use production URLs
- ✅ **Environment variables** properly configured
- ✅ **Multi-site support** enabled

## 🎯 Expected Result

After deployment, users can:
- ✅ Install your app on multiple Webflow sites
- ✅ See all connected sites in the dashboard
- ✅ Manage forms across different sites
- ✅ Receive notifications from any site

The OAuth flow will work seamlessly across multiple sites! 🎉


