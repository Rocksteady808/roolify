'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Form {
  id: string;
  name: string;
  siteId: string;
  displayName?: string;
}

export default function ExtensionDashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteId, setSiteId] = useState<string>('');

  useEffect(() => {
    // Try to get siteId from URL params or localStorage
    const params = new URLSearchParams(window.location.search);
    const urlSiteId = params.get('siteId');
    
    if (urlSiteId) {
      setSiteId(urlSiteId);
      fetchForms(urlSiteId);
    } else {
      // Try to get from localStorage (last selected site)
      const lastSiteId = localStorage.getItem('lastSelectedSiteId');
      if (lastSiteId) {
        setSiteId(lastSiteId);
        fetchForms(lastSiteId);
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchForms = async (currentSiteId: string) => {
    try {
      const response = await fetch(`/api/webflow/site/${currentSiteId}/forms`);
      if (response.ok) {
        const data = await response.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="border-b pb-3">
        <h2 className="text-xl font-semibold text-gray-900">Roolify</h2>
        <p className="text-sm text-gray-600">Manage conditional logic for your forms</p>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        <a 
          href={`/rule-builder${siteId ? `?siteId=${siteId}` : ''}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full p-3 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700 transition-colors font-medium"
        >
          Create New Rule
        </a>
        <a 
          href="/dashboard" 
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full p-3 border border-gray-300 text-gray-700 text-center rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Open Full Dashboard
        </a>
      </div>

      {/* Forms List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-sm text-gray-600">Loading forms...</p>
        </div>
      ) : forms.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Your Forms</h3>
          <div className="space-y-2">
            {forms.map((form) => (
              <a
                key={form.id}
                href={`/rule-builder?formId=${form.id}&siteId=${siteId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all"
              >
                <div className="font-medium text-sm text-gray-900">
                  {form.displayName || form.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  ID: {form.id.substring(0, 8)}...
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No forms found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {siteId ? 'This site has no forms yet.' : 'Please select a site first.'}
          </p>
          <div className="mt-4">
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="pt-4 border-t text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> Click any form to create conditional logic rules.
          For full features, open the dashboard in a new tab.
        </p>
      </div>
    </div>
  );
}






