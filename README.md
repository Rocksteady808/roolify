# Roolify - Webflow Form Automation SaaS

A powerful SaaS application that enables dynamic conditional logic, email notifications, and form submission tracking for Webflow sites.

## 🚀 Features

- **Conditional Logic**: Show/hide form fields based on user input
- **Email Notifications**: Route form submissions to different email addresses based on conditions
- **Multi-Site Support**: Manage multiple Webflow sites from one dashboard
- **Form Submission Tracking**: Store and export form submissions
- **OAuth Integration**: Secure Webflow site connection
- **Subscription Plans**: Tiered pricing with usage limits

## 📁 Project Structure

```
.
├── nextjs-app/          # Main Next.js application (primary)
├── webflow-extension/   # Webflow Designer Extension
├── vite-app/           # Alternative frontend (legacy)
└── README.md           # This file
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Xano (Backend-as-a-Service)
- **Authentication**: Xano Auth (formerly Memberstack)
- **Payments**: Stripe
- **Email**: SendGrid
- **OAuth**: Webflow OAuth 2.0

## 📋 Prerequisites

- Node.js 18+ and npm
- Webflow Developer Account
- Xano Workspace
- Stripe Account (optional, for payments)
- SendGrid Account (optional, for emails)

## ⚙️ Environment Variables

Create a `.env.local` file in the `nextjs-app/` directory:

```bash
# Webflow OAuth (https://developers.webflow.com/)
WEBFLOW_CLIENT_ID=your_webflow_client_id_here
WEBFLOW_CLIENT_SECRET=your_webflow_client_secret_here

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Xano Backend (https://xano.io)
NEXT_PUBLIC_XANO_AUTH_BASE_URL=https://your-instance.xano.io/api:your-auth-api-id
NEXT_PUBLIC_XANO_MAIN_BASE_URL=https://your-instance.xano.io/api:your-main-api-id

# Stripe (optional - https://stripe.com)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# SendGrid (optional - https://sendgrid.com)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

See `.env.example` for a complete template.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd nextjs-app
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

### 3. Set Up Webflow OAuth App

1. Go to [Webflow Developer Portal](https://developers.webflow.com/)
2. Create a new app
3. Add redirect URI: `http://localhost:3000/api/auth/callback`
4. Copy Client ID and Client Secret to `.env.local`

### 4. Run Development Server

```bash
npm run dev
```

The app will run on [http://localhost:3000](http://localhost:3000)

## 📦 Deployment

### Deploy to Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
cd nextjs-app
vercel --prod
```

3. Add environment variables in Vercel Dashboard
4. Update Webflow OAuth redirect URI to your production URL

See [nextjs-app/PRODUCTION_DEPLOY.md](nextjs-app/PRODUCTION_DEPLOY.md) for detailed deployment instructions.

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Project overview and architecture
- [PRODUCTION_DEPLOY.md](nextjs-app/PRODUCTION_DEPLOY.md) - Production deployment guide
- [DYNAMIC_ARCHITECTURE.md](nextjs-app/DYNAMIC_ARCHITECTURE.md) - Multi-site architecture
- [XANO_INTEGRATION.md](nextjs-app/XANO_INTEGRATION.md) - Xano backend integration
- [FORM_SUBMISSIONS.md](nextjs-app/FORM_SUBMISSIONS.md) - Submission tracking system

## 🔒 Security

- All sensitive credentials use environment variables
- OAuth tokens stored securely in Xano
- Row-level security for multi-user data isolation
- HTTPS enforced in production
- No hardcoded API keys in source code

## 🏗️ Architecture

### Data Flow

```
Webflow Site → OAuth → Next.js App → Xano Database
     ↓
Form Submissions → Webhook → Xano Storage
     ↓
Rules Engine → Universal Script → Client-Side Execution
```

### Key Principles

1. **100% Dynamic** - No hardcoded site URLs or form names
2. **Multi-User** - Complete data isolation per user
3. **Self-Contained Scripts** - Rules embedded at generation time
4. **API-First** - Xano handles all backend operations

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📝 Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## 🤝 Contributing

This is a private project. Contact the repository owner for contribution guidelines.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions:
- Check the documentation in `/nextjs-app/*.md` files
- Review [CLAUDE.md](CLAUDE.md) for architecture details
- Contact: [Your support email]

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Webflow API Documentation](https://developers.webflow.com/docs)
- [Xano Documentation](https://docs.xano.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

Built with ❤️ for Webflow developers
