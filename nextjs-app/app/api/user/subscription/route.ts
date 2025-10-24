import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/serverAuth';

export async function GET() {
  try {
    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has subscription-related fields
    const hasActiveSubscription = !!(
      user.stripe_customer_id || 
      user.subscription_status === 'active' ||
      user.subscription_status === 'trial'
    );

    const subscriptionInfo = {
      hasActiveSubscription,
      subscriptionStatus: user.subscription_status || 'none',
      stripeCustomerId: user.stripe_customer_id || null,
      planId: user.plan_id || null,
      canDeleteAccount: !hasActiveSubscription
    };

    return NextResponse.json(subscriptionInfo);
  } catch (error: any) {
    console.error('Subscription check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
