'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
    { id: 'connecting-sites', title: 'Connecting Sites', icon: '🔗' },
    { id: 'creating-rules', title: 'Creating Rules', icon: '⚙️' },
    { id: 'notifications', title: 'Notifications', icon: '📧' },
    { id: 'submissions', title: 'Submissions', icon: '📊' },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Documentation</h1>
          <p className="text-lg text-gray-600">
            Everything you need to know about using Roolify
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <nav className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Contents</h2>
              <ul className="space-y-2">
                {sections.map((section) => (
                  <li key={section.id}>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="mr-2">{section.icon}</span>
                      {section.title}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {activeSection === 'getting-started' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">🚀 Getting Started</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What is Roolify?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Roolify is a powerful Webflow app that adds advanced functionality to your forms including conditional logic, 
                    smart email routing, and comprehensive submission management.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Quick Start</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                    <li>
                      <strong>Create an account</strong> - Sign up at Roolify and verify your email
                    </li>
                    <li>
                      <strong>Connect your Webflow site</strong> - Click "Connect to Webflow" and authorize the app
                    </li>
                    <li>
                      <strong>Select a form</strong> - Choose which form you want to enhance
                    </li>
                    <li>
                      <strong>Create rules</strong> - Add conditional logic to show/hide fields
                    </li>
                    <li>
                      <strong>Install the script</strong> - Copy the script tag and add it to your Webflow site
                    </li>
                    <li>
                      <strong>Publish your site</strong> - Publish your Webflow site to activate the rules
                    </li>
                  </ol>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Tip:</strong> Start with simple rules and test them before creating complex logic chains.
                    </p>
                  </div>

                  <div className="mt-6">
                    <Link href="/setup" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                      View detailed setup guide →
                    </Link>
                  </div>
                </div>
              )}

              {activeSection === 'connecting-sites' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">🔗 Connecting Webflow Sites</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">How to Connect</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                    <li>Go to your <Link href="/dashboard" className="text-blue-600 hover:underline">Dashboard</Link></li>
                    <li>Click the "Connect to Webflow" button</li>
                    <li>Log in to your Webflow account if prompted</li>
                    <li>Select which sites you want to authorize</li>
                    <li>Click "Authorize" to grant Roolify access</li>
                    <li>You'll be redirected back to your dashboard with your sites connected</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">What Access Does Roolify Need?</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Roolify requests read access to your site structure and forms. We need this to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Retrieve your form fields and structure</li>
                    <li>Display your forms in the dashboard</li>
                    <li>Generate the correct conditional logic script</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Managing Connected Sites</h3>
                  <p className="text-gray-700 leading-relaxed">
                    You can disconnect sites at any time from your dashboard. This will:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li>Revoke Roolify's access to that site</li>
                    <li>Stop tracking new form submissions</li>
                    <li>Preserve your existing rules and submissions (for 30 days)</li>
                  </ul>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-yellow-900">
                      <strong>⚠️ Important:</strong> Disconnecting a site will stop conditional logic from working on that site's forms 
                      until you reconnect and reinstall the script.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'creating-rules' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">⚙️ Creating Conditional Logic Rules</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Rule Builder Basics</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Rules consist of two parts: <strong>Conditions</strong> (when) and <strong>Actions</strong> (then).
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Creating Your First Rule</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                    <li>Navigate to the <Link href="/rule-builder" className="text-blue-600 hover:underline">Rule Builder</Link></li>
                    <li>Select a form from the dropdown</li>
                    <li>Click "Add Condition"</li>
                    <li>Choose a field, operator, and value (e.g., "Country equals USA")</li>
                    <li>Click "Add Action"</li>
                    <li>Choose an action type (Show, Hide, Enable, Disable, Set Value)</li>
                    <li>Select the target field</li>
                    <li>Click "Save Rule"</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Available Operators</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>equals</strong> - Exact match</li>
                    <li><strong>not equals</strong> - Does not match</li>
                    <li><strong>contains</strong> - Includes text</li>
                    <li><strong>greater than</strong> - Numeric comparison</li>
                    <li><strong>less than</strong> - Numeric comparison</li>
                    <li><strong>is empty</strong> - Field has no value</li>
                    <li><strong>is not empty</strong> - Field has a value</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Available Actions</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Show Field</strong> - Make a hidden field visible</li>
                    <li><strong>Hide Field</strong> - Hide a field from view</li>
                    <li><strong>Enable Field</strong> - Allow user input</li>
                    <li><strong>Disable Field</strong> - Prevent user input</li>
                    <li><strong>Set Value</strong> - Automatically fill a field</li>
                    <li><strong>Set Required</strong> - Make a field required</li>
                    <li><strong>Set Optional</strong> - Make a field optional</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Example Rules</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Show state field for US residents:</p>
                      <p className="text-sm text-gray-700">
                        <strong>If</strong> Country equals "United States"<br />
                        <strong>Then</strong> Show "State" field
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Require phone for business inquiries:</p>
                      <p className="text-sm text-gray-700">
                        <strong>If</strong> Inquiry Type equals "Business"<br />
                        <strong>Then</strong> Set "Phone" field to Required
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">Auto-fill department based on topic:</p>
                      <p className="text-sm text-gray-700">
                        <strong>If</strong> Topic contains "billing"<br />
                        <strong>Then</strong> Set "Department" value to "Finance"
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Pro Tip:</strong> You can add multiple conditions to a single rule. All conditions must be true 
                      for the actions to execute (AND logic).
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">📧 Email Notifications</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Setting Up Notifications</h3>
                  <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                    <li>Go to <Link href="/notifications" className="text-blue-600 hover:underline">Notifications</Link></li>
                    <li>Select a form</li>
                    <li>Configure admin routing (where to send notifications)</li>
                    <li>Optionally configure user routing (auto-reply to submitter)</li>
                    <li>Customize email templates with placeholders</li>
                    <li>Save your settings</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Admin Routing</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Send form submissions to different email addresses based on form data:
                  </p>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-3">
                    <p className="text-sm text-gray-700">
                      <strong>Example:</strong><br />
                      If Department equals "Sales" → send to sales@company.com<br />
                      If Department equals "Support" → send to support@company.com
                    </p>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">User Routing (Auto-Reply)</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Automatically send a confirmation email to the person who submitted the form.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Email Template Placeholders</h3>
                  <p className="text-gray-700 leading-relaxed mb-3">
                    Use placeholders to insert form data into your emails:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><code className="bg-gray-100 px-2 py-1 rounded">{'{{name}}'}</code> - Inserts the "name" field value</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">{'{{email}}'}</code> - Inserts the "email" field value</li>
                    <li><code className="bg-gray-100 px-2 py-1 rounded">{'{{message}}'}</code> - Inserts the "message" field value</li>
                  </ul>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Example Email Template:</p>
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
{`Hi {{name}},

Thank you for contacting us! We received your message:

"{{message}}"

We'll get back to you at {{email}} within 24 hours.

Best regards,
The Team`}
                    </pre>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-yellow-900">
                      <strong>⚠️ Note:</strong> Placeholder names must exactly match your form field names (case-sensitive).
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'submissions' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">📊 Managing Submissions</h2>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Viewing Submissions</h3>
                  <p className="text-gray-700 leading-relaxed">
                    All form submissions are automatically captured and stored in your <Link href="/submissions" className="text-blue-600 hover:underline">Submissions</Link> dashboard.
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Features</h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Filter by form</strong> - View submissions for specific forms</li>
                    <li><strong>Search</strong> - Find submissions by content</li>
                    <li><strong>Date range</strong> - Filter by submission date</li>
                    <li><strong>Export to CSV</strong> - Download submissions for analysis</li>
                    <li><strong>View details</strong> - See all submitted data</li>
                  </ul>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">Data Retention</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Submissions are stored according to your plan:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Free Plan:</strong> 100 submissions/month, 30 days retention</li>
                    <li><strong>Pro Plan:</strong> 1,000 submissions/month, 90 days retention</li>
                    <li><strong>Business Plan:</strong> Unlimited submissions, 1 year retention</li>
                  </ul>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Tip:</strong> Export your submissions regularly to keep a permanent backup.
                    </p>
                  </div>
                </div>
              )}

              {activeSection === 'troubleshooting' && (
                <div className="prose max-w-none">
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">🔧 Troubleshooting</h2>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Forms not appearing in dashboard</h3>
                      <p className="text-gray-700 mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        <li>Click the "Refresh" button in the dashboard</li>
                        <li>Verify you're connected to the correct Webflow site</li>
                        <li>Ensure your forms are published in Webflow</li>
                        <li>Check that forms have the proper form element (not just inputs)</li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Conditional logic not working</h3>
                      <p className="text-gray-700 mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        <li>Verify the Roolify script is installed in your Webflow site's custom code</li>
                        <li>Check that field names in your rules exactly match Webflow field names (case-sensitive)</li>
                        <li>Ensure your Webflow site is published (not just in preview mode)</li>
                        <li>Clear your browser cache and test in an incognito window</li>
                        <li>Check browser console for JavaScript errors</li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Submissions not being captured</h3>
                      <p className="text-gray-700 mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        <li>Confirm the Roolify script is in your site's custom code (head section)</li>
                        <li>Verify your site is published</li>
                        <li>Check that the form has a proper submit button</li>
                        <li>Test the form submission and check the browser's Network tab for errors</li>
                        <li>Ensure you haven't exceeded your plan's submission limit</li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">Email notifications not sending</h3>
                      <p className="text-gray-700 mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        <li>Double-check email addresses for typos</li>
                        <li>Verify notification settings are saved</li>
                        <li>Check spam/junk folders</li>
                        <li>Ensure placeholder names match your form field names exactly</li>
                        <li>Test with a simple template first, then add complexity</li>
                      </ul>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">OAuth/Connection errors</h3>
                      <p className="text-gray-700 mb-2"><strong>Solutions:</strong></p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-700">
                        <li>Try disconnecting and reconnecting your Webflow site</li>
                        <li>Clear browser cookies and cache</li>
                        <li>Ensure you're logged into the correct Webflow account</li>
                        <li>Try a different browser</li>
                        <li>Contact support if the issue persists</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
                    <h4 className="font-semibold text-gray-900 mb-2">Still need help?</h4>
                    <p className="text-sm text-gray-700 mb-3">
                      If you can't find a solution here, our support team is ready to help.
                    </p>
                    <Link 
                      href="/support"
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Contact Support →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}




