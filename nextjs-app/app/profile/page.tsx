'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ShadcnSidebar from '@/components/ShadcnSidebar';
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/lib/auth';
import { xanoAuth } from '@/lib/xano';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfilePageInner />
    </ProtectedRoute>
  );
}

function ProfilePageInner() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  // Profile update states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change states
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Account deletion states
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');


  // Initialize form with user data
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  // Fetch subscription info
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setSubscriptionInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch subscription info:', error);
      }
    };

    if (user) {
      fetchSubscriptionInfo();
    }
  }, [user]);


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    
    try {
      setIsUpdatingProfile(true);
      await xanoAuth.updateProfile({ name, email });
      await refreshUser(); // Refresh user data in context
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      console.error('Profile update error:', error);
      setProfileMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setIsChangingPassword(true);
      await xanoAuth.changePassword(oldPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
      
      // Clear password fields
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      setPasswordMessage({ type: 'error', text: error.message || 'Failed to change password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.url, '_blank');
      } else {
        const error = await response.json();
        setDeleteMessage({ type: 'error', text: error.error || 'Failed to open subscription management' });
      }
    } catch (error: any) {
      console.error('Subscription management error:', error);
      setDeleteMessage({ type: 'error', text: 'Failed to open subscription management' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      setDeleteMessage(null);

      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDeleteMessage({ type: 'success', text: data.message });
        // Redirect to login after successful deletion
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const error = await response.json();
        setDeleteMessage({ type: 'error', text: error.error || 'Failed to delete account' });
      }
    } catch (error: any) {
      console.error('Account deletion error:', error);
      setDeleteMessage({ type: 'error', text: 'Failed to delete account' });
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteConfirmation(false);
      setDeleteConfirmationText('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const joinDate = user.created_at 
    ? (() => {
        // Handle different timestamp formats from Xano
        const timestamp = user.created_at;
        let date;
        
        if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
          // Already a valid date string
          date = new Date(timestamp);
        } else if (typeof timestamp === 'number') {
          // Check if it's in seconds (Unix timestamp) or milliseconds
          if (timestamp < 10000000000) { // Less than year 2001 in milliseconds
            date = new Date(timestamp * 1000); // Convert from seconds to milliseconds
          } else {
            date = new Date(timestamp); // Already in milliseconds
          }
        } else {
          date = new Date(timestamp);
        }
        
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      })()
    : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarProvider>
        <ShadcnSidebar />
        <main className="relative flex w-full flex-1 flex-col bg-gray-50 px-4 lg:px-6 pt-20 lg:pt-8 pb-8 overflow-x-hidden">
          <div className="max-w-7xl w-full mx-auto">
            <div className="mb-6">
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-sm text-gray-600">Manage your account information and preferences</p>
            </div>

          <div className="space-y-6">
            {/* Account Information Card */}
            <div className="bg-white border rounded-lg p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="text-base text-gray-900 break-words">{user.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <div className="text-base text-gray-900 break-words">{user.email}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                  <div className="text-base text-gray-600 break-words">{user.id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <div className="text-base text-gray-600">{joinDate}</div>
                </div>
              </div>
            </div>

            {/* Update Profile Card */}
            <div className="bg-white border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Profile</h2>
              
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="john@example.com"
                    required
                  />
                </div>

                {profileMessage && (
                  <div className={`p-3 rounded-md ${profileMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {profileMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* Change Password Card */}
            <div className="bg-white border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h2>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label htmlFor="old-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter current password"
                    style={{ '--placeholder-color': '#374151' } as React.CSSProperties}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter new password (min. 8 characters)"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>

                {passwordMessage && (
                  <div className={`p-3 rounded-md ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {passwordMessage.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Delete Account Card */}
            <div className="bg-white border rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Delete Account</h2>
              
              {subscriptionInfo?.hasActiveSubscription ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Active Subscription Required
                        </h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <p>You have an active subscription. Please cancel your subscription first before deleting your account.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleManageSubscription}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Manage Subscription
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">
                          Danger Zone
                        </h3>
                        <div className="mt-2 text-sm text-red-700">
                          <p>Once you delete your account, there is no going back. This action will permanently delete your account and all associated data.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {!showDeleteConfirmation ? (
                    <button
                      onClick={() => setShowDeleteConfirmation(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Delete Account
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-red-800 mb-2">Final Confirmation Required</h4>
                        <p className="text-sm text-red-700 mb-3">
                          This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                        </p>
                        <p className="text-sm text-red-700 font-medium">
                          To confirm deletion, type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> in the box below:
                        </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <input
                          type="text"
                          value={deleteConfirmationText}
                          onChange={(e) => setDeleteConfirmationText(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeletingAccount || deleteConfirmationText !== 'DELETE'}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        >
                          {isDeletingAccount ? 'Deleting...' : 'Yes, Delete My Account'}
                        </button>
                        
                        <button
                          onClick={() => {
                            setShowDeleteConfirmation(false);
                            setDeleteConfirmationText('');
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {deleteMessage && (
                    <div className={`p-3 rounded-md ${deleteMessage.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                      {deleteMessage.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}

