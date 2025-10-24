'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ShadcnSidebar from '@/components/ShadcnSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from '@/components/ProtectedRoute';

export default function SetupPage() {
  const [siteId, setSiteId] = useState('');
  const [appUrl, setAppUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Auto-detect app URL
    if (typeof window !== 'undefined') {
      setAppUrl(window.location.origin);
    }
    
    // Try to get siteId from connected sites
    fetch('/api/webflow/sites')
      .then(res => res.json())
      .then(data => {
        if (data.sites && data.sites.length > 0) {
          setSiteId(data.sites[0].siteId);
        }
      })
      .catch(err => console.error('Failed to load sites:', err));
  }, []);

  const unifiedScript = `<!-- Roolify Unified Script - Handles BOTH Conditional Logic AND Form Submissions -->
<script src="${appUrl}/api/script/unified/${siteId}"></script>`;

  const [copiedScript, setCopiedScript] = useState(false);

  const copyToClipboard = (script: string) => {
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <SidebarProvider>
          <ShadcnSidebar />
          <main className="relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 pt-20 lg:pt-8 pb-8 overflow-x-hidden">
            <div className="max-w-7xl w-full mx-auto">
              <div className="mb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">Roolify Setup - One Script Does It All!</h1>
              <p className="text-sm text-gray-600">
                Add ONE script to your Webflow site to enable both conditional logic and form submission capture
              </p>
            </div>

            {/* Features Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-white border border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Conditional Logic</h3>
                </div>
                <p className="text-sm text-gray-600">Show/hide fields based on user selections</p>
              </div>

              <div className="bg-white border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold text-gray-900">Form Submissions</h3>
                </div>
                <p className="text-sm text-gray-600">Automatically capture and store all submissions</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Installation Instructions</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Open Webflow Project Settings</h3>
                      <p className="text-sm text-gray-700">
                        In your Webflow Designer, go to <strong>Project Settings → Custom Code</strong>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Copy the Unified Script</h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Copy this ONE script and paste it in the <strong>"Footer Code"</strong> section
                      </p>
                      
                      <div className="bg-gradient-to-r from-indigo-50 to-green-50 border border-indigo-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">⚡</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">One Script, Two Powerful Features</p>
                            <p className="text-xs text-gray-600">Handles both conditional logic rules AND form submission capture</p>
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <pre className="bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm">
                          <code>{unifiedScript}</code>
                        </pre>
                        <button
                          onClick={() => copyToClipboard(unifiedScript)}
                          className="absolute top-2 right-2 px-3 py-1.5 bg-white text-gray-900 rounded text-xs font-medium hover:bg-gray-100 transition-colors"
                        >
                          {copiedScript ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Publish your site</h3>
                      <p className="text-sm text-gray-700">
                        Click <strong>Save</strong> and then <strong>Publish</strong> your Webflow site
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">Done!</h3>
                      <p className="text-sm text-gray-700">
                        The unified script will automatically:
                      </p>
                      <ul className="mt-2 space-y-1">
                        <li className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-indigo-600">•</span>
                          <span>Execute your conditional logic rules</span>
                        </li>
                        <li className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span>Capture and store form submissions</span>
                        </li>
                      </ul>
                      <p className="text-sm text-gray-700 mt-3">
                        View your submissions at <Link href="/submissions" className="text-blue-600 hover:underline font-semibold">Form Submissions</Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🔧 Configuration</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">App URL</label>
                  <input
                    type="text"
                    value={appUrl}
                    onChange={(e) => setAppUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="http://localhost:3000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The URL where your Roolify app is running
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site ID</label>
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="your-webflow-site-id"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your Webflow site ID (auto-detected from connected sites)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="flex gap-3">
                <Link
                  href="/rule-builder"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Rules
                </Link>
                <Link
                  href="/submissions"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
                  </svg>
                  View Submissions
                </Link>
              </div>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </main>
      </SidebarProvider>
      </div>
    </ProtectedRoute>
  );
}

