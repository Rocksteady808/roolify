'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OAuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Unknown error';
  const description = searchParams.get('description') || 'An unexpected error occurred during authorization';
  const details = searchParams.get('details');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          OAuth Authorization Failed
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We encountered an issue while connecting to Webflow
        </p>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-semibold text-red-900 mb-2">Error Details:</h2>
          <p className="text-sm text-red-800 mb-1">
            <span className="font-medium">Error:</span> {error}
          </p>
          <p className="text-sm text-red-800">
            <span className="font-medium">Description:</span> {description}
          </p>
          {details && (
            <p className="text-sm text-red-800 mt-2">
              <span className="font-medium">Additional Info:</span> {details}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <a
            href="/api/auth/install"
            className="block w-full bg-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </a>
          
          <a
            href="/dashboard"
            className="block w-full bg-gray-200 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Go to Dashboard
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Common Solutions:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Make sure you authorized the app in Webflow</li>
            <li>Check that your redirect URI matches in Webflow settings</li>
            <li>Try clearing your browser cache and cookies</li>
            <li>Contact support if the issue persists</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="mailto:info@roolify.com?subject=OAuth%20Error&body=Error:%20{error}%0A%0ADescription:%20{description}"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}

export default function OAuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <OAuthErrorContent />
    </Suspense>
  );
}



