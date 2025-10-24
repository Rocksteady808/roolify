'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ScriptSetup() {
  const [siteId, setSiteId] = useState('');
  const [scriptUrl, setScriptUrl] = useState('');
  const [scriptCode, setScriptCode] = useState('');

  useEffect(() => {
    // Get the first connected site ID
    const fetchConnectedSites = async () => {
      try {
        const response = await fetch('/api/webflow/sites');
        if (response.ok) {
          const data = await response.json();
          if (data.sites && data.sites.length > 0) {
            setSiteId(data.sites[0].siteId);
            setScriptUrl(`http://localhost:3000/api/script/serve/${data.sites[0].siteId}`);
          }
        }
      } catch (error) {
        console.error('Error fetching connected sites:', error);
      }
    };

    fetchConnectedSites();
  }, []);

  const generateScript = async () => {
    if (!siteId) return;

    try {
      const response = await fetch(`/api/script/serve/${siteId}`);
      if (response.ok) {
        const script = await response.text();
        setScriptCode(script);
      }
    } catch (error) {
      console.error('Error generating script:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                ← Back to Dashboard
              </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Universal Script Setup</h1>
            <p className="text-gray-600">
              Embed the universal script in your Webflow site to enable dynamic form logic.
              The script automatically updates whenever you create, modify, or delete rules.
            </p>
          </div>

          <div className="space-y-8">
            {/* Site Configuration */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">1. Site Configuration</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site ID
                  </label>
                  <input
                    type="text"
                    value={siteId}
                    onChange={(e) => setSiteId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your Webflow site ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Script URL
                  </label>
                  <input
                    type="text"
                    value={scriptUrl}
                    onChange={(e) => setScriptUrl(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="http://localhost:3000/api/script/serve/YOUR_SITE_ID"
                  />
                </div>
              </div>
            </div>

            {/* Installation Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">2. Installation Instructions</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-green-800 mb-2">Option A: Direct Script Tag (Recommended)</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Add this script tag to your Webflow site's custom code section:
                  </p>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <code>
                      {`<script src="${scriptUrl}"></script>`}
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-green-800 mb-2">Option B: Inline Script</h3>
                  <p className="text-sm text-green-700 mb-3">
                    If you prefer to embed the script directly, click the button below to generate the full script:
                  </p>
                  <button
                    onClick={generateScript}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Generate Full Script
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Script */}
            {scriptCode && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Generated Script</h2>
                <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto max-h-96 overflow-y-auto">
                  <pre>{scriptCode}</pre>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Copy this script and paste it into your Webflow site's custom code section.
                </p>
              </div>
            )}

            {/* Features */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-purple-900 mb-4">4. Features</h2>
              <ul className="space-y-2 text-purple-800">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Automatic Updates:</strong> Script updates automatically when you modify rules
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Real-time Logic:</strong> Form logic executes instantly on user interactions
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Multi-page Support:</strong> Works across all pages on your site
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Universal Detection:</strong> Automatically detects all form elements
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Smart Show/Hide:</strong> Elements hidden on live site, visible in Webflow designer for editing
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <strong>Form Validation:</strong> Conditional field requirements and validation
                </li>
              </ul>
            </div>

            {/* Webflow Setup */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-yellow-900 mb-4">5. Webflow Setup</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Step 1: Add Custom Code</h3>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
                    <li>Go to your Webflow project settings</li>
                    <li>Navigate to the "Custom Code" tab</li>
                    <li>Add the script tag to the "Footer Code" section</li>
                    <li>Publish your site</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Step 2: Designer vs Live Site</h3>
                  <div className="space-y-2 text-yellow-700 text-sm">
                    <div className="bg-yellow-100 p-3 rounded">
                      <strong>In Webflow Designer:</strong> All elements remain visible for easy editing
                    </div>
                    <div className="bg-yellow-100 p-3 rounded">
                      <strong>On Live Site:</strong> Elements start hidden and only show when conditions are met
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-yellow-800 mb-2">Step 3: Test Your Rules</h3>
                  <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
                    <li>Visit your published site</li>
                    <li>Open browser developer tools (F12)</li>
                    <li>Look for "[Roolify Universal Script]" messages in the console</li>
                    <li>Test your form logic by interacting with form elements</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-900 mb-4">6. Troubleshooting</h2>
              <div className="space-y-3 text-red-800">
                <div>
                  <strong>Script not loading?</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                    <li>Check that your site is published</li>
                    <li>Verify the script URL is correct</li>
                    <li>Check browser console for errors</li>
                  </ul>
                </div>
                <div>
                  <strong>Rules not working?</strong>
                  <ul className="list-disc list-inside ml-4 mt-1 text-sm">
                    <li>Ensure form elements have proper IDs</li>
                    <li>Check that rules are active in the dashboard</li>
                    <li>Verify element IDs match your rule conditions</li>
                  </ul>
                </div>
                <div>
                  <strong>Need help?</strong>
                  <p className="text-sm mt-1">
                    Check the browser console for detailed logs and error messages.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
