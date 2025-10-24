'use client';

import { useState, useEffect } from 'react';
import { isTestModeEnabled, getTestCounts } from '@/lib/testModeStore';
import { isCurrentUserAdmin } from '@/lib/adminUtils';
import TestModeModal from './TestModeModal';

export default function TestModeBanner() {
  const [testModeActive, setTestModeActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    setUserIsAdmin(isCurrentUserAdmin());
    setTestModeActive(isTestModeEnabled());
  }, []);

  // Don't show banner if not admin or test mode is not active
  if (!userIsAdmin || !testModeActive) {
    return null;
  }

  const counts = getTestCounts();

  return (
    <>
      <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">
            🧪 Test Mode Active - Plan limits are being simulated
          </span>
          <span className="text-orange-100 text-xs">
            (Forms: {counts.forms}, Rules: {counts.rules}, Submissions: {counts.submissions})
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="ml-2 underline hover:text-orange-100 transition-colors"
          >
            Configure
          </button>
        </div>
      </div>
      
      <TestModeModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  );
}







