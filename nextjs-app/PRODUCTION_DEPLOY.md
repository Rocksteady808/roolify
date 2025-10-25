# 🚀 Production Deployment Guide - Vercel

This guide will help you deploy Roolify to production on Vercel.

## Prerequisites

- Vercel account (free tier works fine)
- Webflow app created with OAuth credentials
- All features tested locally with ngrok

---

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

Or use npx without installing:
```bash
npx vercel
```

---

## Step 2: Deploy to Vercel

1. Navigate to your project:
```bash
cd nextjs-app
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy (first time):
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No
- **What's your project's name?** → `roolify` (or your choice)
- **In which directory is your code located?** → `./`
- **Want to modify settings?** → No

4. Deploy to production:
```bash
vercel --prod
```

Vercel will give you a production URL like:
`https://roolify.vercel.app` or `https://roolify-username.vercel.app`

---

## Step 3: Configure Environment Variables

Go to your Vercel dashboard: https://vercel.com/dashboard

1. Select your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables (one at a time):

```bash
# Webflow OAuth (get from https://developers.webflow.com/)
WEBFLOW_CLIENT_ID=your_webflow_client_id_here
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret_here

# App URLs (REPLACE WITH YOUR VERCEL URL)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback

# Memberstack (get from Memberstack dashboard)
NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY=your_memberstack_public_key_here

# Xano (get from your Xano workspace)
NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://your-instance.xano.io/api:your-api-id
NEXT_PUBLIC_XANO_API_BASE_URL=https://your-instance.xano.io/api:your-api-id

# SendGrid (get from https://app.sendgrid.com/settings/api_keys)
SENDGRID_API_KEY=your_sendgrid_api_key_here
```

**Important:** 
- Replace `https://your-app.vercel.app` with your actual Vercel URL
- Set environment to **Production** for all variables
- Click **Save** after each variable

---

## Step 4: Update Webflow App Settings

1. Go to Webflow Developer Portal: https://developers.webflow.com/
2. Select your Roolify app
3. Go to **Settings**
4. Update **Redirect URI**:
   - Delete: `https://YOUR_NGROK_URL.ngrok-free.app/api/auth/callback`
   - Add: `https://your-app.vercel.app/api/auth/callback`
5. Click **Save Changes**

**Important:** The redirect URI must match EXACTLY (including https://, no trailing slash)

---

## Step 5: Redeploy After Adding Environment Variables

After adding environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or use the Vercel dashboard:
- Go to **Deployments** → Click **⋮** → **Redeploy**

---

## Step 6: Test OAuth Flow in Production

1. Visit your production URL: `https://your-app.vercel.app`
2. Click "Connect to Webflow" or visit: `https://your-app.vercel.app/api/auth/install`
3. Authorize the app in Webflow
4. You should be redirected to your dashboard
5. Verify that sites appear in the dashboard

---

## Step 7: Update Designer Extension (Optional)

If you're using the Designer Extension, update the homepage:

**File: `nextjs-app/webflow.json`**
```json
{
  "name": "Roolify",
  "apiVersion": "2",
  "size": "large",
  "publicDir": ".next",
  "homepage": "https://your-app.vercel.app/dashboard"
}
```

Then redeploy:
```bash
vercel --prod
```

---

## Troubleshooting

### Error: "invalid_redirect_uri"

✅ **Solution:**
- Make sure Webflow app redirect URI matches EXACTLY
- Check that environment variables are set in Vercel
- Redeploy after changing environment variables

### Error: "OAuth credentials not configured"

✅ **Solution:**
- Add `WEBFLOW_CLIENT_ID` and `WEBFLOW_CLIENT_SECRET` to Vercel
- Make sure they're set for **Production** environment
- Redeploy the app

### Forms/Rules not loading

✅ **Solution:**
- Check Xano environment variables are correct
- Verify Webflow tokens are being stored
- Check browser console for API errors

### SendGrid emails not sending

✅ **Solution:**
- Verify `SENDGRID_API_KEY` is set in Vercel
- Check SendGrid dashboard for delivery status
- Verify sender email is verified in SendGrid

---

## Monitoring & Logs

### View Logs
```bash
vercel logs your-app.vercel.app
```

Or in Vercel dashboard:
- **Deployments** → Select deployment → **Function Logs**

### Check Environment Variables
```bash
vercel env ls
```

---

## Updating Your App

1. Make changes to your code
2. Commit to Git (optional but recommended)
3. Run:
```bash
vercel --prod
```

Vercel will automatically deploy your changes.

---

## Custom Domain (Optional)

To use your own domain (e.g., `app.roolify.com`):

1. Go to Vercel dashboard → Your project → **Settings** → **Domains**
2. Add your domain
3. Update DNS records (Vercel will show you what to add)
4. Update Webflow app redirect URI to your custom domain
5. Update environment variables with new domain
6. Redeploy

---

## Security Best Practices

1. **Never commit secrets to Git**
   - Keep `.env.local` in `.gitignore`
   - Use Vercel environment variables for production

2. **Rotate secrets regularly**
   - Change client secret every 3-6 months
   - Update in both Webflow and Vercel

3. **Monitor access logs**
   - Check Vercel logs for suspicious activity
   - Monitor Webflow API usage

---

## Cost Estimates

**Vercel Free Tier includes:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Serverless functions

**Estimated costs for 100 users:**
- Vercel: $0 (free tier sufficient)
- Xano: $25/month (standard plan)
- SendGrid: $15/month (essentials plan)
- Webflow: $0 (API access included)

**Total: ~$40/month**

---

## Next Steps After Deployment

1. ✅ Test OAuth flow on production
2. ✅ Verify all API endpoints work
3. ✅ Test form creation and rules
4. ✅ Test email notifications
5. ✅ Test multi-site installation
6. 🎉 Start onboarding users!

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Test OAuth flow step-by-step

**Vercel Documentation:**
- https://vercel.com/docs
- https://vercel.com/docs/deployments/overview

**Webflow OAuth Documentation:**
- https://developers.webflow.com/data/docs/oauth






