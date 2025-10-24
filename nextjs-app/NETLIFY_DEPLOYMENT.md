# Netlify Deployment Guide for Roolify

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: Set up your environment variables in Netlify

## Deployment Steps

### 1. Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "New site from Git"
3. Choose "GitHub" and authorize Netlify
4. Select your `Rocksteady808/roolify` repository
5. Choose the `main` branch

### 2. Build Settings

Netlify will automatically detect the settings from `netlify.toml`:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Node version**: 18

### 3. Environment Variables

Set these environment variables in Netlify Dashboard → Site settings → Environment variables:

#### Required Variables:
```
NEXT_PUBLIC_XANO_API_URL=https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj
NEXT_PUBLIC_XANO_PUBLIC_KEY=your_xano_public_key
XANO_API_KEY=your_xano_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
WEBFLOW_CLIENT_ID=0f2deed02579b7613e8df536899050e17c02ad3a61d2a7bbaf0f80e4a63b596d
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

#### Optional Variables:
```
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

### 4. Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Add your custom domain
3. Configure DNS settings as instructed by Netlify

### 5. Webhook Configuration

Update your Webflow OAuth redirect URI to point to your Netlify domain:
```
https://your-site-name.netlify.app/api/auth/callback
```

## Important Notes

### API Routes
Your app uses Next.js API routes which require serverless functions. Netlify supports this through:
- Automatic detection of API routes in `/api` directory
- Serverless function execution for API endpoints

### CORS Configuration
The app is configured to allow:
- All origins for API routes (for Webflow integration)
- Proper CORS headers for webhook endpoints

### Build Optimization
- Images are unoptimized for static hosting
- Trailing slashes enabled for better routing
- Static assets cached appropriately

## Troubleshooting

### Build Failures
1. Check Node.js version (should be 18)
2. Verify all environment variables are set
3. Check build logs in Netlify dashboard

### API Route Issues
1. Ensure API routes are in `/api` directory
2. Check function timeout settings
3. Verify CORS headers are correct

### Webflow Integration
1. Update OAuth redirect URI to Netlify domain
2. Test webhook endpoints after deployment
3. Verify CORS settings allow Webflow origins

## Post-Deployment Checklist

- [ ] Site loads correctly
- [ ] Authentication works
- [ ] API routes respond
- [ ] Webflow OAuth redirects work
- [ ] Form submissions are captured
- [ ] Email notifications work
- [ ] Webhook endpoints are accessible

## Support

If you encounter issues:
1. Check Netlify build logs
2. Verify environment variables
3. Test API endpoints individually
4. Check browser console for errors

