# 🔷 Stripe Integration Guide

## 📋 What You Have in Xano

Your Xano backend already has complete Stripe endpoints:

### **1. Checkout Sessions** (API Group: `stripe_checkout`)
- `POST /api:xPOHgksV/stripe_checkout/sessions` - Create checkout session
- `GET /api:xPOHgksV/stripe_checkout/sessions` - List sessions
- `GET /api:xPOHgksV/stripe_checkout/sessions/{id}` - Get session details
- `POST /api:xPOHgksV/stripe_checkout/webhooks` - Webhook for completed payments

### **2. Products** (API Group: `products`)
- `GET /api:jL5_ibNc/products` - List products
- `POST /api:jL5_ibNc/products` - Create product
- `GET /api:jL5_ibNc/products/{id}` - Get product
- `POST /api:jL5_ibNc/products/{id}` - Update product
- `DELETE /api:jL5_ibNc/products/{id}` - Delete product

### **3. Prices** (API Group: `prices`)
- `GET /api:WO9ZsUj5/prices` - List prices
- `POST /api:WO9ZsUj5/prices` - Create price
- `GET /api:WO9ZsUj5/prices/{id}` - Get price
- `POST /api:WO9ZsUj5/prices/{id}` - Update price

---

## 🔧 Step 1: Set Up Stripe in Xano

### A. Get Your Stripe API Key

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Click **Developers** → **API Keys**
3. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### B. Add to Xano Environment Variables

1. Go to your Xano workspace
2. Click **Settings** → **Environment Variables**
3. Add variable:
   - **Name**: `stripe_api_secret`
   - **Value**: Your Stripe secret key (e.g., `sk_test_51...`)

---

## 🚀 Step 2: Connect Stripe to Your Next.js App

### A. Install Stripe SDK

```bash
cd nextjs-app
npm install stripe @stripe/stripe-js
```

### B. Add Stripe Keys to `.env.local`

```env
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

# Xano Stripe Endpoints
XANO_STRIPE_CHECKOUT_URL=https://x8ki-letl-twmt.n7.xano.io/api:xPOHgksV/stripe_checkout
XANO_STRIPE_PRODUCTS_URL=https://x8ki-letl-twmt.n7.xano.io/api:jL5_ibNc/products
XANO_STRIPE_PRICES_URL=https://x8ki-letl-twmt.n7.xano.io/api:WO9ZsUj5/prices
```

---

## 💳 Step 3: Create Stripe Products & Prices

You need to create Stripe products and prices that match your Xano plans:

### Option A: Create via Stripe Dashboard (Easiest)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Click **Add Product**
3. Create 3 products:

**Product 1: Starter Plan**
- Name: "Roolify Starter"
- Description: "5 forms, 10 logic rules, 10k submissions/month"
- Price: $39.00 USD
- Billing: Monthly recurring
- Copy the **Price ID** (starts with `price_...`)

**Product 2: Pro Plan**
- Name: "Roolify Pro"
- Description: "20 forms, 50 logic rules, 50k submissions/month"
- Price: $69.00 USD
- Billing: Monthly recurring
- Copy the **Price ID**

**Product 3: Agency Plan**
- Name: "Roolify Agency"
- Description: "50 forms, 200 logic rules, 100k submissions/month"
- Price: $109.00 USD
- Billing: Monthly recurring
- Copy the **Price ID**

### Option B: Create via Xano API (Advanced)

Call your Xano endpoints to create products/prices programmatically.

---

## 🔗 Step 4: Implement Stripe Checkout in Next.js

### A. Create Stripe Client (`lib/stripe.ts`)

```typescript
import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Price IDs for your plans
export const STRIPE_PRICE_IDS = {
  starter_monthly: 'price_1234...', // Replace with your actual price IDs
  pro_monthly: 'price_5678...',
  agency_monthly: 'price_9012...',
  starter_yearly: 'price_3456...',
  pro_yearly: 'price_7890...',
  agency_yearly: 'price_1357...',
};

// Map Stripe price IDs to Xano plan IDs
export const PRICE_TO_PLAN_MAP: Record<string, number> = {
  [STRIPE_PRICE_IDS.starter_monthly]: 1, // Xano plan_id for Starter
  [STRIPE_PRICE_IDS.pro_monthly]: 2,     // Xano plan_id for Pro
  [STRIPE_PRICE_IDS.agency_monthly]: 3,  // Xano plan_id for Agency
  [STRIPE_PRICE_IDS.starter_yearly]: 4,
  [STRIPE_PRICE_IDS.pro_yearly]: 5,
  [STRIPE_PRICE_IDS.agency_yearly]: 6,
};
```

### B. Create Checkout Endpoint (`app/api/stripe/checkout/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_IDS } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();
    
    // Validate price ID
    if (!Object.values(STRIPE_PRICE_IDS).includes(priceId)) {
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription', // or 'payment' for one-time
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      client_reference_id: userId.toString(), // Link to your user
      metadata: {
        userId: userId.toString(),
        priceId: priceId,
      },
    });
    
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### C. Create Webhook Handler (`app/api/stripe/webhook/route.ts`)

```typescript
import { NextResponse } from 'next/server';
import { stripe, PRICE_TO_PLAN_MAP } from '@/lib/stripe';
import { headers } from 'next/headers';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = headers().get('stripe-signature')!;
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId || session.client_reference_id;
        
        // Get the price ID to determine which plan
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        if (userId && priceId) {
          // Map price ID to Xano plan ID
          const xanoPlanId = PRICE_TO_PLAN_MAP[priceId];
          
          // Update user's plan in Xano
          await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:pU92d7fv/user/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan_id: xanoPlanId }),
          });
          
          console.log(`✅ Updated user ${userId} to plan ${xanoPlanId}`);
        }
        
        // Also save to Xano session table via webhook
        await fetch('https://x8ki-letl-twmt.n7.xano.io/api:xPOHgksV/stripe_checkout/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        // Downgrade user to free plan or handle cancellation
        break;
      }
      
      case 'customer.subscription.updated': {
        // Handle plan changes
        const subscription = event.data.object as Stripe.Subscription;
        // Update user's plan based on new subscription
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
```

---

## 🎨 Step 5: Create Pricing Page

### Create `/app/pricing/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Starter',
    price: 39,
    priceId: 'price_starter_monthly', // Replace with actual Stripe price ID
    features: [
      '5 forms',
      '10 logic rules',
      '10,000 submissions/month',
      'Email notifications',
      'Custom HTML templates',
    ],
  },
  {
    name: 'Pro',
    price: 69,
    priceId: 'price_pro_monthly',
    features: [
      '20 forms',
      '50 logic rules',
      '50,000 submissions/month',
      'Priority support',
      'Advanced analytics',
    ],
    popular: true,
  },
  {
    name: 'Agency',
    price: 109,
    priceId: 'price_agency_monthly',
    features: [
      '50 forms',
      '200 logic rules',
      '100,000 submissions/month',
      'White-label option',
      'Dedicated support',
    ],
  },
];

export default function PricingPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  
  async function handleUpgrade(priceId: string) {
    if (!isAuthenticated) {
      router.push('/login?redirect=/pricing');
      return;
    }
    
    setLoading(priceId);
    
    try {
      // Create checkout session
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId, 
          userId: user?.id 
        }),
      });
      
      const data = await res.json();
      
      if (data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setLoading(null);
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Start free, upgrade as you grow
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.popular ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-indigo-600 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {plan.name}
              </h2>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">
                  ${plan.price}
                </span>
                <span className="text-gray-600">/month</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(plan.priceId)}
                disabled={loading === plan.priceId}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading === plan.priceId ? 'Loading...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 🔔 Step 6: Set Up Stripe Webhook

### A. Get Webhook Signing Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set URL: `https://your-domain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing Secret** (starts with `whsec_...`)

### B. Add to `.env.local`

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

### C. Test Webhook Locally

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:1337/api/stripe/webhook
```

---

## 🎯 Step 7: Implement Upgrade Flow

### A. Add "Upgrade" Button to Dashboard

```tsx
// nextjs-app/app/dashboard/page.tsx

import Link from 'next/link';

// Inside your component:
{!user?.is_admin && currentForms >= maxForms * 0.8 && (
  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold text-orange-900">
          You're approaching your plan limit
        </h3>
        <p className="text-sm text-orange-700">
          You've used {currentForms}/{maxForms} forms
        </p>
      </div>
      <Link
        href="/pricing"
        className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
      >
        Upgrade Plan
      </Link>
    </div>
  </div>
)}
```

### B. Handle Successful Payment

```tsx
// nextjs-app/app/dashboard/page.tsx

useEffect(() => {
  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  
  if (sessionId) {
    // Show success message
    toast.success('Payment successful! Your plan has been upgraded.');
    
    // Refresh user data to get new plan
    refreshUser();
    
    // Clean URL
    window.history.replaceState({}, '', '/dashboard');
  }
}, []);
```

---

## 🔄 Complete User Flow

### 1. **User Hits Limit**
```
User creates 5th form (Starter plan limit)
→ Dashboard shows warning: "You've reached your limit"
→ "Upgrade to Pro" button appears
```

### 2. **User Clicks Upgrade**
```
User clicks "Upgrade to Pro"
→ Redirects to /pricing page
→ User selects "Pro" plan
→ Clicks "Get Started"
```

### 3. **Stripe Checkout**
```
Frontend calls /api/stripe/checkout
→ Creates Stripe checkout session
→ Redirects user to Stripe hosted checkout page
→ User enters payment info
→ User completes payment
```

### 4. **Webhook Updates Plan**
```
Stripe sends webhook to /api/stripe/webhook
→ Verifies signature
→ Extracts user ID and price ID
→ Maps price ID to Xano plan ID
→ Updates user.plan_id in Xano
→ User now has Pro limits (20 forms, 50 rules, 50k submissions)
```

### 5. **User Returns to App**
```
Stripe redirects to /dashboard?session_id=cs_...
→ Dashboard shows success message
→ Refreshes user data
→ User can now create 20 forms!
```

---

## 🧪 Testing Checklist

- [ ] Install Stripe npm packages
- [ ] Add Stripe keys to `.env.local`
- [ ] Create products in Stripe Dashboard
- [ ] Copy price IDs to `lib/stripe.ts`
- [ ] Create `/api/stripe/checkout/route.ts`
- [ ] Create `/api/stripe/webhook/route.ts`
- [ ] Create `/app/pricing/page.tsx`
- [ ] Set up Stripe webhook endpoint
- [ ] Test with Stripe test cards:
  - Success: `4242 4242 4242 4242`
  - Decline: `4000 0000 0000 0002`
- [ ] Verify plan update in Xano after payment
- [ ] Test admin bypass (admins shouldn't see pricing)

---

## 💡 Pro Tips

### 1. **Use Stripe Test Mode**
Always test with `sk_test_...` keys first before going live!

### 2. **Handle Failed Payments**
Listen for `payment_intent.payment_failed` webhook to notify users.

### 3. **Subscription Management**
Add a "Manage Subscription" button that opens Stripe Customer Portal:

```typescript
const session = await stripe.billingPortal.sessions.create({
  customer: user.stripeCustomerId,
  return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
});
// Redirect to session.url
```

### 4. **Store Stripe Customer ID**
Add `stripe_customer_id` field to your Xano `user` table to link users to Stripe customers.

---

## 🎉 Result

After implementation:
- ✅ Users can upgrade/downgrade plans
- ✅ Payments processed securely via Stripe
- ✅ Plan limits automatically updated
- ✅ Subscription management handled
- ✅ Webhooks keep Xano in sync with Stripe
- ✅ Admin users bypass all limits

**Ready to implement?** Start with Step 2 (Install Stripe SDK) and work through each step! 🚀

