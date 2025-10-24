"use client";
import React from 'react';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'forms' | 'rules' | 'submissions';
  currentCount: number;
  maxLimit: number;
  planName: string;
}

export default function PlanLimitModal({
  isOpen,
  onClose,
  limitType,
  currentCount,
  maxLimit,
  planName
}: PlanLimitModalProps) {
  if (!isOpen) return null;

  const getLimitTypeDisplay = (type: string) => {
    switch (type) {
      case 'forms': return 'forms';
      case 'rules': return 'logic rules';
      case 'submissions': return 'submissions';
      default: return type;
    }
  };

  const getLimitTypeIcon = (type: string) => {
    switch (type) {
      case 'forms':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'rules':
        return (
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'submissions':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getLimitTypeIcon(limitType)}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Plan Limit Reached
              </h3>
              <p className="text-sm text-gray-600">
                {getLimitTypeDisplay(limitType).charAt(0).toUpperCase() + getLimitTypeDisplay(limitType).slice(1)} limit exceeded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Usage */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Current Usage</span>
            <span className="text-sm text-gray-600">
              {currentCount} / {maxLimit === -1 ? '∞' : maxLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${maxLimit === -1 ? 0 : Math.min((currentCount / maxLimit) * 100, 100)}%` 
              }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            You're using <strong>{currentCount}</strong> of your <strong>{maxLimit === -1 ? 'unlimited' : maxLimit}</strong> {getLimitTypeDisplay(limitType)} on the <strong>{planName}</strong> plan.
          </p>
        </div>

        {/* Message */}
        <div className="mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                You've reached the maximum number of {getLimitTypeDisplay(limitType)} allowed on your current plan. 
                To create more {getLimitTypeDisplay(limitType)}, you'll need to upgrade your account.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // TODO: Implement upgrade flow
              window.open('/plans', '_blank');
            }}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Need help choosing a plan? <a href="/contact" className="text-blue-600 hover:text-blue-800">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}







