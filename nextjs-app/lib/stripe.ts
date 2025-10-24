import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Price IDs for your plans
export const STRIPE_PRICE_IDS = {
  starter_monthly: 'price_1SLO1oD9Vdg0UF4xNsgaRcMn', // Starter Monthly
  pro_monthly: 'price_1SLTcpD9Vdg0UF4xIJ39oFX4',     // Pro Monthly
  agency_monthly: 'price_1SLTd9D9Vdg0UF4xjKWNZvGm',   // Agency Monthly
  starter_yearly: 'price_1SLTepD9Vdg0UF4xlaolysiV',  // Starter Yearly
  pro_yearly: 'price_1SLTh1D9Vdg0UF4xKvBeKDez',      // Pro Yearly
  agency_yearly: 'price_1SLThMD9Vdg0UF4xNPoMKvMJ',   // Agency Yearly
};

// Map Stripe price IDs to Xano plan IDs
export const PRICE_TO_PLAN_MAP: Record<string, number> = {
  [STRIPE_PRICE_IDS.starter_monthly]: 2, // Xano plan_id for Starter
  [STRIPE_PRICE_IDS.pro_monthly]: 3,     // Xano plan_id for Pro
  [STRIPE_PRICE_IDS.agency_monthly]: 4,  // Xano plan_id for Agency
  [STRIPE_PRICE_IDS.starter_yearly]: 2,  // Same plan, different billing
  [STRIPE_PRICE_IDS.pro_yearly]: 3,     // Same plan, different billing
  [STRIPE_PRICE_IDS.agency_yearly]: 4,  // Same plan, different billing
};
