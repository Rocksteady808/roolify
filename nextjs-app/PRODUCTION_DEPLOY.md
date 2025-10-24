# 🚀 Production Deployment Guide - Vercel

This guide will help you deploy Roolify to production on Vercel.

## Prerequisites

- Vercel account (free tier works fine)
- Webflow app created with OAuth credentials
- All features tested locally with ngrok

## Step 1: Deploy to Vercel

1. **Connect your GitHub repository to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Set the **Root Directory** to `nextjs-app`

2. **Configure Build Settings:**
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

## Step 2: Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```bash
# Webflow OAuth
WEBFLOW_CLIENT_ID=your_webflow_client_id
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
WEBFLOW_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback

# Xano
NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj
NEXT_PUBLIC_XANO_API_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj

# SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**Important:** 
- Replace `https://your-app.vercel.app` with your actual Vercel URL
- Set environment to **Production** for all variables

## Step 3: Update Webflow App Settings

1. **Update OAuth Redirect URI:**
   - Go to your Webflow app settings
   - Update the redirect URI to: `https://your-app.vercel.app/api/auth/callback`

2. **Update App URL:**
   - Set the app URL to: `https://your-app.vercel.app`

## Step 4: Test Deployment

1. **Visit your Vercel URL** to ensure the app loads
2. **Test OAuth flow** by connecting a Webflow site
3. **Test form submission** to ensure webhooks work

## Step 5: Domain Setup (Optional)

1. **Add Custom Domain:**
   - Go to Vercel Dashboard → Domains
   - Add your custom domain
   - Update DNS records as instructed

2. **Update Webflow App Settings:**
   - Update OAuth redirect URI with your custom domain
   - Update app URL with your custom domain

## Troubleshooting

### Common Issues:

1. **404 Errors:**
   - Ensure `next.config.mjs` has correct configuration
   - Check that all API routes are properly exported

2. **OAuth Issues:**
   - Verify redirect URI matches exactly
   - Check environment variables are set correctly

3. **Build Failures:**
   - Check Node.js version (should be 18+)
   - Ensure all dependencies are in package.json

### Debug Commands:

```bash
# Check build locally
cd nextjs-app
npm run build

# Test production build
npm start
```

## Security Notes

- Never commit `.env` files to git
- Use Vercel's environment variables for secrets
- Enable HTTPS (automatic with Vercel)
- Regularly rotate API keys

## Next Steps

After successful deployment:
1. Test all features thoroughly
2. Set up monitoring and logging
3. Configure backup strategies
4. Plan for scaling if needed

---

**Need Help?** Check the troubleshooting section or contact support.
