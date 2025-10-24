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
        const session = event.data.object as any;
        
        // Get user ID from metadata
        const userId = session.metadata?.userId || session.client_reference_id;
        
        // Get the price ID to determine which plan
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
        const priceId = lineItems.data[0]?.price?.id;
        
        if (userId && priceId) {
          // Map price ID to Xano plan ID
          const xanoPlanId = PRICE_TO_PLAN_MAP[priceId];
          
          if (xanoPlanId) {
            // Update user's plan in Xano
            await fetch(`https://x1zj-piqu-kkh1.n7e.xano.io/api:sb2RCLwj/user/${userId}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.XANO_AUTH_TOKEN}`
              },
              body: JSON.stringify({ plan_id: xanoPlanId }),
            });
            
            console.log(`✅ Updated user ${userId} to plan ${xanoPlanId}`);
          }
        }
        
        // Also save to Xano session table via webhook
        await fetch('https://x1zj-piqu-kkh1.n7e.xano.io/api:xPOHgksV/stripe_checkout/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(event),
        });
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as any;
        console.log('Subscription cancelled:', subscription.id);
        // Downgrade user to free plan or handle cancellation
        break;
      }
      
      case 'customer.subscription.updated': {
        // Handle subscription updates
        const subscription = event.data.object as any;
        console.log('Subscription updated:', subscription.id);
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
