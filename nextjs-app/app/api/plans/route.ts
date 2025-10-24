import { NextResponse } from 'next/server';

// Mock plan data since we don't have environment variables set up
const mockPlans = [
  {
    id: 1,
    plan_name: "Free",
    max_sites: 1,
    max_submissions: 100,
    max_logic_rules: 2,
    price: 0,
    billing_period: "monthly"
  },
  {
    id: 2,
    plan_name: "Starter - Monthly",
    max_sites: 3,
    max_submissions: 10000,
    max_logic_rules: 10,
    price: 29,
    billing_period: "monthly"
  },
  {
    id: 3,
    plan_name: "Pro - Monthly", 
    max_sites: 10,
    max_submissions: 50000,
    max_logic_rules: 50,
    price: 49,
    billing_period: "monthly"
  },
  {
    id: 4,
    plan_name: "Agency - Monthly",
    max_sites: 25,
    max_submissions: 100000,
    max_logic_rules: 200,
    price: 99,
    billing_period: "monthly"
  },
  {
    id: 5,
    plan_name: "Free",
    max_sites: 1,
    max_submissions: 100,
    max_logic_rules: 2,
    price: 0,
    billing_period: "yearly"
  },
  {
    id: 6,
    plan_name: "Starter - Yearly",
    max_sites: 3,
    max_submissions: 10000,
    max_logic_rules: 10,
    price: 279,
    billing_period: "yearly"
  },
  {
    id: 7,
    plan_name: "Pro - Yearly",
    max_sites: 10,
    max_submissions: 50000,
    max_logic_rules: 50,
    price: 471,
    billing_period: "yearly"
  },
  {
    id: 8,
    plan_name: "Agency - Yearly",
    max_sites: 25,
    max_submissions: 100000,
    max_logic_rules: 200,
    price: 951,
    billing_period: "yearly"
  }
];

export async function GET() {
  try {
    // Group plans by billing period
    const monthlyPlans = mockPlans.filter((plan: any) => plan.billing_period === 'monthly');
    const yearlyPlans = mockPlans.filter((plan: any) => plan.billing_period === 'yearly');
    
    return NextResponse.json({
      monthly: monthlyPlans,
      yearly: yearlyPlans,
      all: mockPlans
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}
