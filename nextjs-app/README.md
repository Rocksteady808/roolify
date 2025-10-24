# Roolify - Advanced Form Logic for Webflow

**Transform your Webflow forms with conditional logic, smart notifications, and powerful submission handling.**

Roolify is a Webflow app that extends native Webflow forms with advanced capabilities including conditional logic, custom routing, email notifications, and comprehensive submission management - all without writing code.

---

## 🚀 Key Features

- **Conditional Form Logic** - Show/hide fields, enable/disable elements, set values, and control form behavior based on user input
- **Smart Notifications** - Route form submissions to different email addresses based on form data
- **Submission Management** - View, filter, and manage all form submissions in one central dashboard
- **Designer Extension** - Access Roolify directly from the Webflow Designer panel
- **Multi-Site Support** - Manage forms across multiple Webflow sites from one dashboard
- **Plan-Based Limits** - Flexible subscription tiers with usage enforcement
- **Secure & Isolated** - Complete data separation between users

---

## 📋 Prerequisites

Before installing Roolify, ensure you have:

1. **Node.js** - v18 or higher ([Download](https://nodejs.org/))
2. **Webflow Account** - With Designer or Workspace access
3. **Xano Account** - For backend data storage ([Sign up](https://www.xano.com/))
4. **Vercel Account** - For production deployment (optional, [Sign up](https://vercel.com/))

---

## 🛠️ Installation & Setup

### 1. Clone & Install Dependencies

```bash
# Clone the repository
cd nextjs-app

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `nextjs-app` directory:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
# Webflow OAuth (Get from https://developers.webflow.com/)
WEBFLOW_CLIENT_ID=your_actual_client_id
WEBFLOW_CLIENT_SECRET=your_actual_client_secret

# For local development
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Xano Backend (Your actual Xano instance URLs)
XANO_AUTH_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:pU92d7fv
XANO_MAIN_BASE_URL=https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj
```

### 3. Set Up Webflow App

1. Go to [Webflow Developer Portal](https://developers.webflow.com/)
2. Create a new app or select your existing Roolify app
3. Configure OAuth redirect URI: `http://localhost:3000/api/auth/callback` (development)
4. Copy your Client ID and Client Secret to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

Your app will be available at [http://localhost:3000](http://localhost:3000)

### 5. Install Designer Extension (Optional)

```bash
cd ../webflow-extension
npm install
npm run dev
```

The extension will be available at [http://localhost:1337](http://localhost:1337)

---

## 🏗️ Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Xano (BaaS) for authentication & data storage
- **APIs**: Webflow API v2, Xano REST API
- **Deployment**: Vercel (recommended)

### Data Flow

```
Webflow Site (Form Submission)
    ↓
Roolify Script (Client-side logic)
    ↓
Webhook API (/api/submissions/webhook)
    ↓
Xano Database (Store submission)
    ↓
Notification API (Send emails via SendGrid/SMTP)
```

### Multi-User Isolation

Roolify implements complete data isolation between users:

- **Sites**: Each user only sees sites they've installed the app on
- **Forms**: Filtered by user's sites
- **Rules**: Associated with user's forms
- **Submissions**: Linked to user's forms
- **Notifications**: Configured per user's forms

All API routes use server-side authentication (`getCurrentUserId()`) to enforce these boundaries.

---

## 📖 Usage Guide

### Connecting Your First Site

1. Sign up/login at `http://localhost:3000`
2. Click "Connect to Webflow"
3. Authorize Roolify to access your Webflow sites
4. Select a site from the dashboard

### Creating Form Rules

1. Navigate to "Rule Builder"
2. Select a form from the dropdown
3. Add conditions (e.g., "If Country equals 'USA'...")
4. Add actions (e.g., "...then show State field")
5. Save your rule
6. Copy the script tag and add it to your Webflow site's `<head>`

### Setting Up Notifications

1. Go to "Notifications"
2. Select a form
3. Configure admin routing (conditional email addresses)
4. Configure user routing (auto-reply based on submission data)
5. Customize email templates with placeholders
6. Save settings

### Viewing Submissions

1. Navigate to "Submissions"
2. Filter by form, date range, or search
3. Export to CSV for further analysis
4. View detailed submission data

---

## 🚀 Production Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [Vercel](https://vercel.com/new)
   - Import your GitHub repository
   - Set framework preset to "Next.js"

3. **Configure Environment Variables**
   - Add all variables from `.env.local` to Vercel project settings
   - Update URLs to your production domain:
     ```
     NEXT_PUBLIC_REDIRECT_URI=https://your-domain.vercel.app/api/auth/callback
     NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
     ```

4. **Update Webflow OAuth**
   - Go to Webflow Developer Portal
   - Update redirect URI to production URL
   - Redeploy if needed

5. **Test Production**
   - Install app on a test Webflow site
   - Create a rule and test form submission
   - Verify notifications are sent correctly

### Custom Domain (Optional)

1. Add custom domain in Vercel project settings
2. Update DNS records as instructed
3. Update `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_REDIRECT_URI` environment variables
4. Update Webflow OAuth redirect URI

---

## 🐛 Troubleshooting

### OAuth Errors

**Problem**: "Redirect URI mismatch" error during OAuth
**Solution**: Ensure `NEXT_PUBLIC_REDIRECT_URI` in `.env.local` exactly matches the redirect URI configured in Webflow Developer Portal

**Problem**: Black screen after OAuth authorization
**Solution**: Check browser console for errors. Verify `NEXT_PUBLIC_APP_URL` is correct and server is running

### Form Detection Issues

**Problem**: Forms not appearing in dashboard
**Solution**: 
1. Click "Refresh" button in dashboard
2. Verify you're connected to the correct site
3. Check that forms exist and are published in Webflow

### Submission Webhook Not Working

**Problem**: Form submissions not appearing in dashboard
**Solution**:
1. Verify the Roolify script is added to your Webflow site's `<head>`
2. Check browser console for errors on form submission
3. Verify webhook endpoint URL is correct: `https://your-domain.com/api/submissions/webhook`
4. Check Network tab to see if webhook request is being sent

### Notification Emails Not Sending

**Problem**: Emails not being received
**Solution**:
1. Check notification settings are saved correctly
2. Verify email addresses don't have typos
3. Check spam/junk folders
4. Review Xano logs for SendGrid errors
5. Ensure email template placeholders match form field names

### Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3000`
**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- -p 3001
```

---

## 📁 Project Structure

```
nextjs-app/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   │   ├── auth/         # OAuth & authentication
│   │   ├── forms/        # Form management
│   │   ├── rules/        # Logic rules
│   │   ├── notifications/# Email notifications
│   │   └── submissions/  # Form submissions
│   ├── dashboard/        # Main dashboard
│   ├── rule-builder/     # Visual rule builder
│   ├── notifications/    # Notification settings
│   └── submissions/      # Submission viewer
├── components/            # Reusable React components
├── lib/                   # Utilities & API clients
│   ├── xano.ts           # Xano API client
│   ├── serverAuth.ts     # Server-side auth utils
│   └── webflowStore.ts   # Webflow token management
└── public/               # Static assets & scripts

webflow-extension/         # Designer Extension (optional)
├── src/
│   └── index.ts          # Extension logic
└── public/
    └── index.html        # Extension UI
```

---

## 🔐 Security & Privacy

- **Server-Side Authentication**: All API routes verify user identity before processing requests
- **Data Isolation**: Users can only access their own data (sites, forms, rules, submissions)
- **Secure Tokens**: Webflow access tokens stored encrypted in Xano
- **HTTPS Only**: All production traffic encrypted via TLS
- **No Client Secrets**: Sensitive keys never exposed to browser

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary. All rights reserved.

---

## 📞 Support

- **Documentation**: See `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Email**: info@roolify.com (if applicable)

---

## 🎯 Roadmap

- [ ] Zapier integration
- [ ] Advanced form analytics
- [ ] A/B testing for forms
- [ ] Multi-step form support
- [ ] Stripe payment integration
- [ ] Custom webhook destinations

---

**Built with ❤️ for the Webflow community**
