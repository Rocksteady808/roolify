'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';

export default function MigrateSitesPage() {
  const { user, loading: authLoading } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('xano_auth_token');
      
      if (!authToken) {
        throw new Error('No auth token found. Please log in first.');
      }

      const response = await fetch('/api/xano/sites/migrate-from-file', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration failed');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Migration error:', err);
      setError(err.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to migrate sites. Please log in first.
          </p>
          <a
            href="/login"
            className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Migrate Sites to Xano</h1>
          <p className="text-gray-600 mb-6">
            This will migrate your existing sites from local storage to Xano with your user ID.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-900 mb-2">Logged in as:</h2>
            <p className="text-blue-700">{user.name}</p>
            <p className="text-sm text-blue-600">{user.email}</p>
            <p className="text-xs text-blue-500 mt-1">User ID: {user.id}</p>
          </div>

          {!result && !error && (
            <button
              onClick={runMigration}
              disabled={migrating}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {migrating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Migrating Sites...
                </span>
              ) : (
                'Start Migration'
              )}
            </button>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">❌ Migration Failed</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Migration Complete!</h3>
                <p className="text-green-700">{result.message}</p>
                
                <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-gray-900">{result.stats.total}</div>
                    <div className="text-xs text-gray-600">Total Sites</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-green-600">{result.stats.migrated}</div>
                    <div className="text-xs text-gray-600">Migrated</div>
                  </div>
                  <div className="bg-white rounded p-3">
                    <div className="text-2xl font-bold text-red-600">{result.stats.failed}</div>
                    <div className="text-xs text-gray-600">Failed</div>
                  </div>
                </div>
              </div>

              {result.migrated && result.migrated.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">✅ Successfully Migrated Sites:</h4>
                  <ul className="space-y-2">
                    {result.migrated.map((site: any, index: number) => (
                      <li key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-900">{site.siteName}</span>
                        <span className="text-xs text-gray-500">Xano ID: {site.xanoId}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed && result.failed.length > 0 && (
                <div className="bg-white border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-3">❌ Failed Sites:</h4>
                  <ul className="space-y-2">
                    {result.failed.map((site: any, index: number) => (
                      <li key={index} className="p-2 bg-red-50 rounded">
                        <div className="font-medium text-red-900">{site.siteName}</div>
                        <div className="text-xs text-red-600">{site.error}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3">
                <a
                  href="/dashboard"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-center"
                >
                  Go to Dashboard
                </a>
                <button
                  onClick={() => {
                    setResult(null);
                    setError(null);
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Run Again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}





