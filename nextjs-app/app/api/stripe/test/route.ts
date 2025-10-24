import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    // Test Stripe connection by fetching products
    const products = await stripe.products.list({ limit: 3 });
    
    return NextResponse.json({
      success: true,
      message: 'Stripe connection successful',
      products: products.data.map(product => ({
        id: product.id,
        name: product.name,
        active: product.active
      }))
    });
  } catch (error) {
    console.error('Stripe test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
