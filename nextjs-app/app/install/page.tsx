"use client";
import React from "react";

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">🔍 Form Detection Installation</h1>
          
          <div className="prose max-w-none">
            <p className="text-lg text-gray-600 mb-8">
              Install the form detection script on any website to automatically detect and track forms. 
              The script will send form data to your dashboard for analysis.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">📋 Installation Steps</h2>
              <ol className="list-decimal list-inside space-y-3 text-blue-800">
                <li>Copy the script tag below</li>
                <li>Add it to the &lt;head&gt; section of your website</li>
                <li>Forms will be automatically detected and sent to your dashboard</li>
              </ol>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h3 className="text-white font-semibold mb-4">Script to Install:</h3>
              <code className="text-green-400 text-sm block whitespace-pre-wrap">
{`<script src="http://localhost:3000/form-detector.js"></script>`}
              </code>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-yellow-800 mb-4">Important Notes</h3>
              <ul className="list-disc list-inside space-y-2 text-yellow-700">
                <li>Replace <code className="bg-yellow-100 px-1 rounded">localhost:3000</code> with your production domain when deploying</li>
                <li>The script works on any website, not just Webflow sites</li>
                <li>Forms are detected automatically when the page loads</li>
                <li>Form submissions are tracked in real-time</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-xl font-semibold text-green-800 mb-4">What Gets Detected</h3>
              <ul className="list-disc list-inside space-y-2 text-green-700">
                <li>All form elements on the page</li>
                <li>Form field types, names, and labels</li>
                <li>Form submission data (when users submit forms)</li>
                <li>Page URL and detection timestamp</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">🧪 Test the Installation</h3>
              <p className="text-gray-600 mb-4">
                Visit the demo page to see the form detection in action:
              </p>
              <a 
                href="/demo.html" 
                target="_blank"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Demo Page →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








