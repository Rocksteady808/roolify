# Multi-Site OAuth Setup Guide

## 🎯 The Problem
Your Webflow app is currently configured with `localhost` redirect URIs, which only work for local development. When users try to install your app on multiple sites, Webflow can't redirect to localhost because it's not publicly accessible.

## ✅ The Solution

### 1. **Deploy Your App to Production**
You need to deploy your Next.js app to a public URL. Here are your options:

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from your project directory
cd nextjs-app
vercel

# Follow the prompts to deploy
```

#### Option B: Netlify
```bash
# Build your app
npm run build

# Deploy to Netlify (drag and drop the .next folder)
```

#### Option C: Railway, Render, or other platforms
Any platform that gives you a public URL will work.

### 2. **Update Environment Variables**

Create a `.env.local` file in your `nextjs-app` directory:

```env
# Webflow OAuth Configuration
WEBFLOW_CLIENT_ID=0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d
WEBFLOW_CLIENT_SECRET=your_actual_client_secret_here

# Production URLs (replace with your deployed domain)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
```

### 3. **Update Webflow App Settings**

In your Webflow app settings, update the **Redirect URI** to your production URL:

**Current (Broken):**
```
http://localhost:1337/api/auth/callback
```

**New (Working):**
```
https://your-app.vercel.app/api/auth/callback
```

### 4. **Test the Flow**

1. **Deploy your app** to get a public URL
2. **Update the Redirect URI** in Webflow app settings
3. **Test installation** on a new site:
   - Go to your deployed app URL
   - Click "Connect to Webflow"
   - Complete the OAuth flow
   - Verify you're redirected to your production dashboard

## 🔧 Code Changes Made

I've already updated your OAuth routes to use environment variables:

### `/app/api/auth/callback/route.ts`
- ✅ Now uses `NEXT_PUBLIC_REDIRECT_URI` environment variable
- ✅ Now uses `NEXT_PUBLIC_APP_URL` for redirects
- ✅ Falls back to localhost for development

### `/app/api/auth/install/route.ts`
- ✅ Now uses `NEXT_PUBLIC_REDIRECT_URI` environment variable
- ✅ Consistent with callback route

## 🚀 Quick Deploy with Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy your app:**
   ```bash
   cd nextjs-app
   vercel
   ```

3. **Set environment variables in Vercel dashboard:**
   - `WEBFLOW_CLIENT_ID`
   - `WEBFLOW_CLIENT_SECRET`
   - `NEXT_PUBLIC_APP_URL` (your Vercel URL)
   - `NEXT_PUBLIC_REDIRECT_URI` (your Vercel URL + /api/auth/callback)

4. **Update Webflow app settings** with your Vercel URL

## 🧪 Testing Multi-Site Installation

After deployment:

1. **Visit your production app**
2. **Click "Connect to Webflow"**
3. **Authorize the app** for multiple sites
4. **Verify the dashboard** shows all connected sites
5. **Test form scanning** on different sites

## 📋 Checklist

- [ ] Deploy app to production (Vercel/Netlify/etc.)
- [ ] Set environment variables in production
- [ ] Update Webflow app Redirect URI
- [ ] Test OAuth flow on production
- [ ] Test installation on multiple sites
- [ ] Verify dashboard shows all sites
- [ ] Test form scanning on different sites

## 🎯 Expected Result

After following this guide, users should be able to:
- ✅ Install your app on multiple Webflow sites
- ✅ See all connected sites in the dashboard
- ✅ Manage forms and rules across different sites
- ✅ Receive notifications from any connected site

The OAuth flow will work seamlessly across multiple sites because it's now using a public, accessible redirect URI instead of localhost.


