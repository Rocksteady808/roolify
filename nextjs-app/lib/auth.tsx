'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { xanoAuth, User } from './xano';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    // Check if user is authenticated on mount
    const checkAuth = async () => {
      if (xanoAuth.isAuthenticated()) {
        try {
          const userData = await xanoAuth.me();
          setUser(userData);
          
          // Notify extension if running in iframe
          if (window.self !== window.top) {
            window.parent.postMessage({
              type: 'ROOLIFY_USER_UPDATE',
              user: userData,
              source: 'roolify-app'
            }, 'http://localhost:1337');
          }
        } catch (error) {
          console.error('Failed to get user:', error);
          xanoAuth.logout(); // Clear invalid token
        }
      }
      setLoading(false);
    };

    checkAuth();
    
    // Listen for logout messages from extension
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:1337') return;
      
      if (event.data.type === 'ROOLIFY_LOGOUT') {
        logout();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await xanoAuth.login(email, password);
      const userData = await xanoAuth.me();
      setUser(userData);
      
      // Notify extension if running in iframe
      if (typeof window !== 'undefined' && window.self !== window.top) {
        window.parent.postMessage({
          type: 'ROOLIFY_USER_UPDATE',
          user: userData,
          source: 'roolify-app'
        }, 'http://localhost:1337');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      await xanoAuth.signup(name, email, password);
      const userData = await xanoAuth.me();
      setUser(userData);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = () => {
    xanoAuth.logout();
    setUser(null);
    
    // Notify extension if running in iframe
    if (typeof window !== 'undefined' && window.self !== window.top) {
      window.parent.postMessage({
        type: 'ROOLIFY_USER_UPDATE',
        user: null,
        source: 'roolify-app'
      }, 'http://localhost:1337');
    }
  };

  const refreshUser = async () => {
    if (xanoAuth.isAuthenticated()) {
      try {
        const userData = await xanoAuth.me();
        setUser(userData);
      } catch (error) {
        console.error('Failed to refresh user:', error);
        throw error;
      }
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await xanoAuth.sendPasswordReset(email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset link');
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      await xanoAuth.resetPassword(token, newPassword);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      signup, 
      logout, 
      refreshUser,
      sendPasswordReset,
      resetPassword,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

