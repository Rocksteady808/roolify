'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import ShadcnSidebar from '@/components/ShadcnSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from '@/components/ProtectedRoute';
import StripeCheckout from '@/components/StripeCheckout';
import { useAuth } from '@/lib/auth';

interface Plan {
  id: number;
  plan_name: string;
  price: number;
  billing_period: string;
  max_sites: number;
  max_submissions: number;
  max_logic_rules: number;
}

// Stripe Price IDs (client-side safe)
const STRIPE_PRICE_IDS = {
  starter_monthly: 'price_1SLO1oD9Vdg0UF4xNsgaRcMn', // Starter Monthly
  pro_monthly: 'price_1SLTcpD9Vdg0UF4xIJ39oFX4',     // Pro Monthly
  agency_monthly: 'price_1SLTd9D9Vdg0UF4xjKWNZvGm',   // Agency Monthly
  starter_yearly: 'price_1SLTepD9Vdg0UF4xlaolysiV',  // Starter Yearly
  pro_yearly: 'price_1SLTh1D9Vdg0UF4xKvBeKDez',      // Pro Yearly
  agency_yearly: 'price_1SLThMD9Vdg0UF4xNPoMKvMJ',   // Agency Yearly
};

export default function PlansPage() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [plans, setPlans] = useState<{ monthly: Plan[]; yearly: Plan[] }>({ monthly: [], yearly: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<number | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  // Update current plan when user data changes
  useEffect(() => {
    if (user) {
      // Get plan_id from user, default to Free plan (ID 1) if not set
      setCurrentPlanId(user.plan_id || 1);
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/plans');
      if (!response.ok) {
        throw new Error('Failed to fetch plans');
      }
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentPlans = () => {
    return billingPeriod === 'monthly' ? plans.monthly : plans.yearly;
  };

  const formatPrice = (price: number, period: string) => {
    if (price === 0) {
      return 'Free';
    }
    if (period === 'yearly') {
      return `$${price}/year`;
    }
    return `$${price}/month`;
  };

  const getFeatures = (plan: Plan) => {
    const features = [];
    
    if (plan.plan_name === 'Free') {
      features.push('Unlimited sites with webflow.io domain');
    } else if (plan.max_sites === -1) {
      features.push('Unlimited sites');
    } else {
      features.push(`${plan.max_sites} sites`);
    }
    
    if (plan.max_submissions === -1) {
      features.push('Unlimited submissions');
    } else {
      features.push(`${plan.max_submissions.toLocaleString()} submissions`);
    }
    
    if (plan.max_logic_rules === -1) {
      features.push('Unlimited logic rules');
    } else {
      features.push(`${plan.max_logic_rules} logic rules`);
    }
    
    // Add common features based on plan tier
    if (plan.plan_name.toLowerCase().includes('starter')) {
      features.push('Email notifications', 'Basic support');
    } else if (plan.plan_name.toLowerCase().includes('pro')) {
      features.push('Advanced notifications', 'Priority support', 'Custom integrations');
    } else if (plan.plan_name.toLowerCase().includes('agency')) {
      features.push('White-label options', 'Dedicated support', 'Custom development');
    }
    
    return features;
  };

  const getStripePriceId = (plan: Plan) => {
    const planName = plan.plan_name.toLowerCase();
    const isYearly = billingPeriod === 'yearly';
    
    if (planName.includes('starter')) {
      return isYearly ? STRIPE_PRICE_IDS.starter_yearly : STRIPE_PRICE_IDS.starter_monthly;
    } else if (planName.includes('pro')) {
      return isYearly ? STRIPE_PRICE_IDS.pro_yearly : STRIPE_PRICE_IDS.pro_monthly;
    } else if (planName.includes('agency')) {
      return isYearly ? STRIPE_PRICE_IDS.agency_yearly : STRIPE_PRICE_IDS.agency_monthly;
    }
    
    return null; // Free plan has no price ID
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <SidebarProvider>
          <ShadcnSidebar />
          <main className="relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 pt-20 lg:pt-8 pb-8 overflow-x-hidden">
            <div className="max-w-7xl w-full mx-auto">
              <div className="p-4 sm:p-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Choose Your Plan
                  </h1>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-600">
                    Upgrade your account to unlock more features and higher limits
                  </p>
                </div>

                 {/* Billing Period Tabs */}
                 <div className="flex justify-center mb-6 sm:mb-8">
                   <div className="bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                     <button
                       onClick={() => setBillingPeriod('monthly')}
                       className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base flex-1 sm:flex-initial ${
                         billingPeriod === 'monthly'
                           ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
                     >
                       Monthly
                     </button>
                     <button
                       onClick={() => setBillingPeriod('yearly')}
                       className={`px-4 sm:px-6 py-2 rounded-md font-medium transition-colors text-sm sm:text-base flex-1 sm:flex-initial ${
                         billingPeriod === 'yearly'
                           ? 'bg-white text-gray-900 shadow-sm'
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
                     >
                       Yearly
                       <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                         Save 20%
                       </span>
                     </button>
                   </div>
                 </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600">Error loading plans: {error}</p>
                    <button
                      onClick={fetchPlans}
                      className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Try Again
                    </button>
                  </div>
                 ) : (
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                     {getCurrentPlans().map((plan) => (
                       <div
                         key={plan.id}
                         className={`relative bg-white rounded-lg shadow-lg p-4 sm:p-6 flex flex-col ${
                           plan.id === currentPlanId 
                             ? 'ring-2 ring-blue-500 shadow-xl' 
                             : selectedPlan === plan.id.toString() 
                             ? 'ring-2 ring-blue-300' 
                             : ''
                         }`}
                       >
                         {/* Current Plan Badge - centered in the middle */}
                         {plan.id === currentPlanId && (
                           <div className="flex justify-center mb-4">
                             <span className="bg-gray-600 text-white px-3 py-1 rounded-full text-xs font-medium inline-block">
                               Current Plan
                             </span>
                           </div>
                         )}

                         <div className="text-center mb-4 sm:mb-5">
                           <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                             {plan.plan_name.replace(` - ${billingPeriod === 'monthly' ? 'Monthly' : 'Yearly'}`, '')}
                           </h3>
                           <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                             {formatPrice(plan.price, plan.billing_period)}
                           </div>
                           {plan.price > 0 && (
                             <p className="text-xs sm:text-sm text-gray-500">
                               per {billingPeriod === 'monthly' ? 'month' : 'year'}
                             </p>
                           )}
                         </div>

                         <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6 flex-grow">
                           {getFeatures(plan).map((feature, index) => (
                             <li key={index} className="flex items-start">
                               <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                               </svg>
                               <span className="text-sm sm:text-base text-gray-700">{feature}</span>
                             </li>
                           ))}
                         </ul>

                         <div className="text-center mt-auto">
                           {plan.id === currentPlanId ? (
                             <div className="w-full py-3 px-6 rounded-lg font-medium bg-gray-100 text-gray-700 border border-gray-300 cursor-not-allowed">
                               Current Plan
                             </div>
                           ) : plan.plan_name === 'Free' ? (
                             <button
                               onClick={() => setSelectedPlan(plan.id.toString())}
                               className="w-full py-3 px-6 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                             >
                               Select Plan
                             </button>
                           ) : (
                             <StripeCheckout
                               priceId={getStripePriceId(plan)!}
                               planName={plan.plan_name}
                               price={plan.price}
                               billing={billingPeriod}
                             />
                           )}
                         </div>
                       </div>
                    ))}
                  </div>
                )}

                {selectedPlan && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
                          Ready to upgrade?
                        </h3>
                        <p className="text-sm sm:text-base text-green-700">
                          You've selected the {getCurrentPlans().find(p => p.id.toString() === selectedPlan)?.plan_name} plan. 
                          Contact our sales team to complete your upgrade.
                        </p>
                      </div>
                      <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors w-full sm:w-auto flex-shrink-0">
                        Contact Sales
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Need help choosing the right plan?
                  </p>
                  <a 
                    href="/contact" 
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Contact our support team
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}