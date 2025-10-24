'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { isTestModeEnabled, getTestCounts } from '@/lib/testModeStore';
import { isCurrentUserAdmin } from '@/lib/adminUtils';

interface UsageData {
  sites_count: number;
  rules_count: number;
  submissions_count: number;
  limits: {
    max_sites: number;
    max_logic_rules: number;
    max_submissions: number;
  };
  plan_name?: string;
}

export default function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testMode, setTestMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUsage();
    setIsAdmin(isCurrentUserAdmin());
    setTestMode(isTestModeEnabled());
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      
      // Check if test mode is active and user is admin
      const adminMode = isCurrentUserAdmin();
      const testModeActive = isTestModeEnabled();
      
      // TODO: Replace with actual API call to fetch usage from Xano
      // For now, using mock data or test mode data
      let mockUsage: UsageData;
      
      if (adminMode && testModeActive) {
        const testCounts = getTestCounts();
        mockUsage = {
          sites_count: testCounts.sites,
          rules_count: testCounts.rules,
          submissions_count: testCounts.submissions,
          limits: {
            max_sites: 1,
            max_logic_rules: 2,
            max_submissions: 100
          },
          plan_name: 'Free (Test Mode)'
        };
      } else {
        mockUsage = {
          sites_count: 2,
          rules_count: 12,
          submissions_count: 1247,
          limits: {
            max_sites: 5,
            max_logic_rules: 10,
            max_submissions: 10000
          },
          plan_name: 'Starter'
        };
      }
      
      setUsage(mockUsage);
    } catch (error) {
      console.error('Failed to load usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (used: number, max: number) => {
    return Math.min(Math.round((used / max) * 100), 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const stats = [
    {
      label: 'Sites',
      used: usage.sites_count,
      max: usage.limits.max_sites,
      icon: (
        <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )
    },
    {
      label: 'Logic Rules',
      used: usage.rules_count,
      max: usage.limits.max_logic_rules,
      icon: (
        <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
      )
    },
    {
      label: 'Submissions',
      used: usage.submissions_count,
      max: usage.limits.max_submissions,
      icon: (
        <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6M9 8h.01M15 8h.01M7 7a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7z" />
          </svg>
        </div>
      )
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Usage This Month</h3>
            {isAdmin && testMode && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                Test Mode
              </span>
            )}
          </div>
          {usage.plan_name && (
            <p className="text-sm text-gray-600 mt-1">
              Current Plan: <span className="font-medium text-indigo-600">{usage.plan_name}</span>
            </p>
          )}
        </div>
        <Link
          href="/plans"
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Upgrade
        </Link>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => {
          const percentage = getPercentage(stat.used, stat.max);
          const progressColor = getProgressColor(percentage);
          const statusColor = getStatusColor(percentage);

          return (
            <div key={stat.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                </div>
                <span className={`text-sm font-semibold ${statusColor}`}>
                  {stat.used.toLocaleString()} / {stat.max.toLocaleString()}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`${progressColor} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              {percentage >= 90 && (
                <p className="text-xs text-red-600 font-medium">
                  ⚠️ Approaching limit - consider upgrading
                </p>
              )}
              {percentage >= 75 && percentage < 90 && (
                <p className="text-xs text-yellow-600 font-medium">
                  ⚠️ {100 - percentage}% remaining
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Link
          href="/plans"
          className="block w-full text-center py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          View All Plans
        </Link>
      </div>
    </div>
  );
}








