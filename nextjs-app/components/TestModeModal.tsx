'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getTestCounts, setTestCounts, resetTestCounts, disableTestMode } from '@/lib/testModeStore';

interface TestModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestModeModal({ isOpen, onClose }: TestModeModalProps) {
  const [forms, setForms] = useState(0);
  const [rules, setRules] = useState(0);
  const [submissions, setSubmissions] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const counts = getTestCounts();
      setForms(counts.forms);
      setRules(counts.rules);
      setSubmissions(counts.submissions);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setTestCounts({ forms, rules, submissions });
    window.location.reload(); // Refresh to apply new counts
  };

  const handleReset = () => {
    resetTestCounts();
    setForms(0);
    setRules(0);
    setSubmissions(0);
    window.location.reload();
  };

  const handleDisableTestMode = () => {
    disableTestMode();
    window.location.reload();
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] overflow-y-auto" style={{ zIndex: 99999 }}>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[99998]"
          onClick={onClose}
          style={{ zIndex: 99998 }}
        ></div>
        
        <div className="relative bg-white rounded-lg shadow-2xl max-w-md w-full p-6 z-[99999]" style={{ zIndex: 99999 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Test Mode Configuration</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-4">
              Set simulated usage counts to test plan limits. Free plan limits: 1 form, 2 rules, 100 submissions.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Forms Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={forms}
                  onChange={(e) => setForms(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Free plan limit: 1</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rules Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={rules}
                  onChange={(e) => setRules(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Free plan limit: 2</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Submissions Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={submissions}
                  onChange={(e) => setSubmissions(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
                <p className="text-xs text-gray-500 mt-1">Free plan limit: 100</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Save & Apply
            </button>
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reset to Zero
            </button>
          </div>

          <button
            onClick={handleDisableTestMode}
            className="w-full mt-3 text-sm text-red-600 hover:text-red-800 py-2"
          >
            Disable Test Mode
          </button>
        </div>
      </div>
    </div>
  );

  // Use portal to render modal at document root level
  return createPortal(modalContent, document.body);
}

