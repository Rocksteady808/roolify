'use client';

import { useState } from 'react';

export default function SetupPlans() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const seedPlans = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/seed-plans');
      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || data.error || 'Failed to seed plans');
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Plans Setup
            </h1>
            <p className="text-gray-600">
              Click the button below to automatically create all 4 plans in your Xano database.
            </p>
          </div>

          {/* Plans Preview */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Plans to be created:
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Free', forms: 1, submissions: 100, price: '$0' },
                { name: 'Starter', forms: 5, submissions: '1K', price: '$19' },
                { name: 'Pro', forms: 25, submissions: '10K', price: '$49' },
                { name: 'Agency', forms: 100, submissions: '50K', price: '$99' },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Max Forms: {plan.forms}</div>
                    <div>Max Submissions: {plan.submissions}</div>
                    <div className="font-medium text-gray-900 mt-2">
                      {plan.price}/month
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-6">
            <button
              onClick={seedPlans}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating Plans...' : 'Create All Plans in Xano'}
            </button>
          </div>

          {/* Result */}
          {result && !error && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-semibold mb-2">
                Success!
              </h3>
              {result.plans && (
                <div className="space-y-2">
                  {result.plans.map((plan: any) => (
                    <div
                      key={plan.id}
                      className="text-sm text-green-700"
                    >
                      ✓ {plan.name} (ID: {plan.id})
                    </div>
                  ))}
                </div>
              )}
              {result.existingPlans && (
                <div>
                  <p className="text-green-700 mb-2">
                    Plans already exist in database:
                  </p>
                  <div className="space-y-2">
                    {result.existingPlans.map((plan: any) => (
                      <div
                        key={plan.id}
                        className="text-sm text-green-700"
                      >
                        ✓ {plan.name} (ID: {plan.id}) - ${plan.priceMonthly}/mo
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-semibold mb-2">Error</h3>
              <p className="text-red-700 text-sm mb-3">{error}</p>
              {result?.hint && (
                <p className="text-red-600 text-sm">
                  <strong>Hint:</strong> {result.hint}
                </p>
              )}
              <div className="mt-4 text-sm text-red-700">
                <p className="font-semibold mb-2">Make sure you have:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Created a <code className="bg-red-100 px-1 rounded">POST /plan</code> endpoint in Xano</li>
                  <li>The endpoint accepts all required fields (plan_name, max_forms, etc.)</li>
                  <li>Your Xano <code className="bg-red-100 px-1 rounded">plan</code> table exists</li>
                </ol>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">
              Before clicking the button:
            </h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Make sure your Xano <code className="bg-gray-100 px-1 rounded">plan</code> table exists</li>
              <li>Create a <code className="bg-gray-100 px-1 rounded">POST /plan</code> endpoint in Xano</li>
              <li>The endpoint should accept and save all plan fields</li>
            </ol>
          </div>

          {/* Back Link */}
          <div className="mt-6">
            <a
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}








