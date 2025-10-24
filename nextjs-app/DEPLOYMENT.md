# Production Deployment Guide

This guide walks you through deploying Roolify to production using Vercel.

---

## Prerequisites

Before deploying, ensure you have:

- [x] GitHub account
- [x] Vercel account ([Sign up free](https://vercel.com/signup))
- [x] Production Webflow OAuth credentials
- [x] Xano production instance configured
- [x] Custom domain (optional but recommended)

---

## Step 1: Prepare Your Repository

### 1.1 Initialize Git (if not already done)

```bash
cd nextjs-app
git init
git add .
git commit -m "Initial commit - Roolify production ready"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository (e.g., `roolify-app`)
3. Don't initialize with README (you already have one)

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/roolify-app.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Vercel

### 2.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New Project"
3. Import your GitHub repository
4. Select framework preset: **Next.js**
5. Root directory: `nextjs-app` (if monorepo)

### 2.2 Configure Build Settings

Vercel should auto-detect Next.js settings:

```
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**✅ Leave these as default unless you have a custom setup.**

### 2.3 Configure Environment Variables

Add the following environment variables in Vercel project settings:

#### Required Variables

```env
# Webflow OAuth
WEBFLOW_CLIENT_ID=your_production_client_id
WEBFLOW_CLIENT_SECRET=your_production_client_secret

# Production URLs (Update after deployment)
NEXT_PUBLIC_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Xano Production
XANO_AUTH_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:pU92d7fv
XANO_MAIN_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj
```

#### Optional Variables

```env
# Node environment
NODE_ENV=production

# SendGrid (if using)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

### 2.4 Deploy

1. Click "Deploy"
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL like: `https://roolify-app.vercel.app`

---

## Step 3: Update Webflow OAuth Settings

### 3.1 Get Your Production URL

After deployment, Vercel provides you with:
- Deployment URL: `https://your-app.vercel.app`
- Custom domain (if configured): `https://app.roolify.com`

### 3.2 Update Webflow Developer Portal

1. Go to [Webflow Developers](https://developers.webflow.com/)
2. Select your Roolify app
3. Navigate to "OAuth" settings
4. Update **Redirect URI**:
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
5. Save changes

### 3.3 Update Environment Variables in Vercel

1. Go to Vercel Project Settings → Environment Variables
2. Update these variables with your production URL:
   ```
   NEXT_PUBLIC_REDIRECT_URI=https://your-app.vercel.app/api/auth/callback
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```
3. Click "Save"
4. Redeploy to apply changes (Vercel → Deployments → Three dots → Redeploy)

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Add Domain in Vercel

1. Go to Vercel Project Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `app.roolify.com`)
4. Vercel will provide DNS records

### 4.2 Configure DNS

Add the following records to your DNS provider:

**For subdomain (app.roolify.com):**
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

**For root domain (roolify.com):**
```
Type: A
Name: @
Value: 76.76.21.21

Type: A
Name: @
Value: 76.76.21.22
```

### 4.3 Update Environment Variables

1. Update `NEXT_PUBLIC_REDIRECT_URI` and `NEXT_PUBLIC_APP_URL` to use your custom domain
2. Update Webflow OAuth redirect URI to match
3. Redeploy on Vercel

### 4.4 SSL Certificate

Vercel automatically provisions SSL certificates for your domain (usually takes 1-5 minutes).

---

## Step 5: Test Production Deployment

### 5.1 OAuth Flow

1. Visit your production URL
2. Click "Connect to Webflow"
3. Authorize the app
4. Verify you're redirected back to dashboard
5. Check that your sites appear

### 5.2 Form Detection

1. Select a site
2. Click "Refresh" to load forms
3. Verify forms from Webflow appear correctly

### 5.3 Rule Creation

1. Create a test rule
2. Copy the script URL
3. Add to a test Webflow site
4. Submit a form and verify logic works

### 5.4 Notifications

1. Configure notification settings for a test form
2. Submit the form
3. Verify emails are received
4. Check spam folder if not in inbox

### 5.5 Submissions

1. Submit a test form
2. Check Submissions page
3. Verify data appears correctly

---

## Step 6: Deploy Designer Extension (Optional)

The Designer Extension requires a Webflow App listing.

### 6.1 Build Extension

```bash
cd webflow-extension
npm run build
```

This creates a `bundle.zip` file.

### 6.2 Upload to Webflow

1. Go to Webflow Developer Portal
2. Navigate to "Designer Extensions"
3. Upload `bundle.zip`
4. Configure extension settings:
   - **Homepage URL**: `https://your-app.vercel.app/extension`
   - **Size**: Large
   - **Permissions**: Read/Write (if needed)

### 6.3 Test Extension

1. Open any site in Webflow Designer
2. Open Roolify extension from side panel
3. Verify it loads your production app
4. Test creating rules from within Designer

---

## Step 7: Monitoring & Maintenance

### 7.1 Vercel Analytics

Enable Vercel Analytics for insights:
- Performance metrics
- User sessions
- Error tracking

### 7.2 Error Monitoring

Set up error monitoring with Sentry (optional):

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### 7.3 Logging

Vercel provides logs for:
- Build logs
- Runtime logs
- Function logs

Access via: Vercel Dashboard → Your Project → Logs

### 7.4 Performance

Monitor Web Vitals in Vercel:
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

---

## Troubleshooting

### Build Failures

**Problem**: Build fails on Vercel
**Solutions**:
- Check build logs for specific errors
- Ensure all dependencies are in `package.json`
- Verify Node version matches local (use `.nvmrc`)
- Clear cache and redeploy

### OAuth Redirect Mismatch

**Problem**: "redirect_uri_mismatch" error
**Solution**: Ensure `NEXT_PUBLIC_REDIRECT_URI` in Vercel exactly matches the redirect URI in Webflow Developer Portal

### Environment Variables Not Applied

**Problem**: Changes to env vars not working
**Solution**: After updating environment variables, you must redeploy for changes to take effect

### Function Timeout

**Problem**: "Function Timeout" errors
**Solution**: 
- Optimize API routes (reduce external API calls)
- Use Vercel Pro for 60s timeouts (default is 10s)
- Cache frequently accessed data

### Database Connection Issues

**Problem**: Can't connect to Xano
**Solution**:
- Verify Xano URLs are correct
- Check Xano is not blocking Vercel IPs
- Test Xano endpoints directly with Postman

---

## Post-Deployment Checklist

- [ ] Production URL is accessible
- [ ] OAuth flow works correctly
- [ ] Sites load in dashboard
- [ ] Forms are detected
- [ ] Rules can be created
- [ ] Script works on Webflow sites
- [ ] Form submissions are captured
- [ ] Notifications are sent
- [ ] Submissions appear in dashboard
- [ ] Designer Extension loads (if deployed)
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Error monitoring set up
- [ ] Analytics configured
- [ ] Monitoring alerts configured

---

## Rollback Procedure

If something goes wrong in production:

### Option 1: Instant Rollback

1. Go to Vercel → Deployments
2. Find last working deployment
3. Click three dots → "Promote to Production"

### Option 2: Redeploy Previous Commit

```bash
# Find previous working commit
git log

# Revert to that commit
git revert <commit-hash>
git push origin main
```

Vercel will auto-deploy the reverted version.

---

## Scaling Considerations

### Vercel Pro Features

Consider upgrading for:
- 60-second function timeout (vs 10s on free)
- Faster builds
- More team members
- Priority support

### Database Scaling

Monitor Xano usage:
- API call limits
- Storage limits
- Consider Xano Business tier for growth

### CDN & Performance

Vercel automatically provides:
- Global CDN
- Edge caching
- Automatic static optimization

---

## Security Checklist

- [ ] All secrets in environment variables (not code)
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (if needed)
- [ ] User authentication enforced on all API routes
- [ ] Webflow tokens stored securely in Xano
- [ ] Regular dependency updates (`npm audit fix`)

---

## Support

For deployment issues:
- **Vercel Support**: [Vercel Community](https://github.com/vercel/next.js/discussions)
- **Webflow API**: [Webflow Developers](https://developers.webflow.com/)
- **Xano**: [Xano Support](https://docs.xano.com/)

---

**Congratulations! 🎉 Your Roolify app is now live in production.**





