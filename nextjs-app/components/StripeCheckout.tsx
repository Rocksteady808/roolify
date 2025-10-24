'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCheckoutProps {
  priceId: string;
  planName: string;
  price: number;
  billing: 'monthly' | 'yearly';
}

export default function StripeCheckout({ priceId, planName, price, billing }: StripeCheckoutProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        throw new Error('Stripe publishable key not configured');
      }
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Create checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const { sessionId, url } = await response.json();

      if (!url) {
        throw new Error('Failed to create checkout session');
      }

      // Redirect to Stripe checkout URL
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
    >
      {loading ? 'Processing...' : 'Subscribe'}
    </button>
  );
}
