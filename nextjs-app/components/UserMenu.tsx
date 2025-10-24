'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/adminUtils';
import { isTestModeEnabled, toggleTestMode } from '@/lib/testModeStore';
import TestModeModal from './TestModeModal';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const router = useRouter();
  
  const userIsAdmin = user ? isAdmin(user) : false;
  
  // Check test mode status on mount and when menu opens
  useEffect(() => {
    if (userIsAdmin) {
      setTestMode(isTestModeEnabled());
    }
  }, [userIsAdmin, isOpen]);

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/login')}
          className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium"
        >
          Sign in
        </button>
        <button
          onClick={() => router.push('/signup')}
          className="bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium"
        >
          Sign up
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  const handleTestModeToggle = () => {
    const newState = toggleTestMode();
    setTestMode(newState);
    // Force a page refresh to apply test mode changes
    window.location.reload();
  };
  
  const handleOpenTestModal = () => {
    setShowTestModal(true);
    setIsOpen(false);
  };

  return (
    <div className="relative overflow-visible">
      <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg w-full">
        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white text-lg font-bold flex-shrink-0 relative">
          {user.email?.[0]?.toUpperCase() || user.name?.[0]?.toUpperCase() || 'U'}
          {userIsAdmin && testMode && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-white"></div>
          )}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between p-1 rounded hover:bg-gray-100 transition-colors"
          aria-label="Toggle user menu"
        >
          <span className="text-sm font-medium text-gray-700">Account</span>
          <svg 
            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto"
          >
            <div className="py-1">
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="font-semibold text-gray-900 text-sm">{user.name || 'User'}</div>
                <div className="text-sm text-gray-600">{user.email}</div>
              </div>
              
              <button
                onClick={() => {
                  router.push('/profile');
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Profile
              </button>
              <button
                onClick={() => {
                  router.push('/plans');
                  setIsOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Plans & Billing
              </button>
              
              {userIsAdmin && (
                <>
                  <hr className="my-1 border-gray-200" />
                  <div className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Test Mode</span>
                      <button
                        onClick={handleTestModeToggle}
                        className={`relative inline-flex h-5 w-12 flex-shrink-0 cursor-pointer rounded-full border border-gray-300 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          testMode 
                            ? 'bg-orange-500 focus:ring-orange-500' 
                            : 'bg-gray-200 focus:ring-gray-400'
                        }`}
                        style={{ minHeight: '20px', minWidth: '48px' }}
                        aria-label="Toggle test mode"
                        role="switch"
                        aria-checked={testMode}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white border border-gray-400 shadow-sm ring-0 transition duration-200 ease-in-out ${
                            testMode ? 'translate-x-6.5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    {testMode && (
                      <button
                        onClick={handleOpenTestModal}
                        className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        ⚙️ Configure Test Limits
                      </button>
                    )}
                  </div>
                  </>
                )}
                
                <hr className="my-1 border-gray-200" />
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
      
      <TestModeModal isOpen={showTestModal} onClose={() => setShowTestModal(false)} />
    </div>
  );
}
