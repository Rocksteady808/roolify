'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application error:', error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Something went wrong
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. Don't worry, your data is safe.
        </p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h2 className="text-sm font-semibold text-red-900 mb-2">Error Details (Development Only):</h2>
            <p className="text-sm text-red-800 font-mono break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-red-700 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="block w-full bg-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <a
            href="/dashboard"
            className="block w-full bg-gray-200 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Go to Dashboard
          </a>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">What you can try:</h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Refresh the page</li>
            <li>Clear your browser cache</li>
            <li>Try a different browser</li>
            <li>Check your internet connection</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            If this problem persists, please contact our support team
          </p>
          <a 
            href={`mailto:info@roolify.com?subject=Application%20Error${error.digest ? `%20(${error.digest})` : ''}&body=Error%20Message:%20${encodeURIComponent(error.message || 'Unknown error')}`}
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




