import { NextResponse } from 'next/server';

/**
 * Seed Plans - One-time setup endpoint
 * Visit this endpoint ONCE to populate your Xano plan table with all 4 plans
 * 
 * GET /api/seed-plans
 */

const XANO_MAIN_BASE_URL = 'https://x8ki-letl-twmt.n7.xano.io/api:sb2RCLwj';

const PLANS = [
  {
    plan_name: 'Free',
    max_sites: 1,
    max_logic_rules: 5,
    max_submissions: 100,
    price_monthly: 0,
    price_annual: 0,
    stripe_price_id_monthly: '',
    stripe_price_id_annual: '',
    is_active: true,
  },
  {
    plan_name: 'Starter',
    max_sites: 3,
    max_logic_rules: 50,
    max_submissions: 1000,
    price_monthly: 29,
    price_annual: 279,
    stripe_price_id_monthly: '',
    stripe_price_id_annual: '',
    is_active: true,
  },
  {
    plan_name: 'Pro',
    max_sites: 10,
    max_logic_rules: 250,
    max_submissions: 10000,
    price_monthly: 49,
    price_annual: 471,
    stripe_price_id_monthly: '',
    stripe_price_id_annual: '',
    is_active: true,
  },
  {
    plan_name: 'Agency',
    max_sites: 25,
    max_logic_rules: 1000,
    max_submissions: 50000,
    price_monthly: 99,
    price_annual: 951,
    stripe_price_id_monthly: '',
    stripe_price_id_annual: '',
    is_active: true,
  },
];

export async function GET() {
  try {
    console.log('[Seed Plans] Starting plan seeding...');

    // First, check if plans already exist
    const checkResponse = await fetch(`${XANO_MAIN_BASE_URL}/plan`);
    
    if (checkResponse.ok) {
      const existingPlans = await checkResponse.json();
      
      if (existingPlans && existingPlans.length > 0) {
        console.log('[Seed Plans] Plans already exist!');
        return NextResponse.json({
          success: false,
          message: 'Plans already exist in database',
          existingPlans: existingPlans.map((p: any) => ({
            id: p.id,
            name: p.plan_name,
            maxSites: p.max_sites,
            priceMonthly: p.price_monthly,
          })),
        }, { status: 200 });
      }
    }

    // Create all plans
    const results = [];
    
    for (const plan of PLANS) {
      console.log(`[Seed Plans] Creating plan: ${plan.plan_name}`);
      
      const response = await fetch(`${XANO_MAIN_BASE_URL}/plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plan),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create ${plan.plan_name}: ${errorText}`);
      }

      const createdPlan = await response.json();
      results.push(createdPlan);
      console.log(`[Seed Plans] ✅ Created: ${plan.plan_name} (ID: ${createdPlan.id})`);
    }

    console.log('[Seed Plans] ✅ All plans created successfully!');

    return NextResponse.json({
      success: true,
      message: 'All plans created successfully!',
      plans: results.map(p => ({
        id: p.id,
        name: p.plan_name,
        maxSites: p.max_sites,
        maxSubmissions: p.max_submissions,
        priceMonthly: p.price_monthly,
      })),
    });

  } catch (error) {
    console.error('[Seed Plans] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Make sure you have a POST /plan endpoint in Xano with the correct fields',
      },
      { status: 500 }
    );
  }
}








