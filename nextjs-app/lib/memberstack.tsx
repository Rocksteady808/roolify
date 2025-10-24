'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Member {
  id: string;
  email: string;
  auth?: {
    email?: string;
  };
  customFields?: Record<string, any>;
  metaData?: Record<string, any>;
}

interface MemberstackContextType {
  member: Member | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  ms: any; // Full Memberstack instance for advanced use
}

const MemberstackContext = createContext<MemberstackContextType | undefined>(undefined);

export function MemberstackProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [ms, setMs] = useState<any>(null);

  useEffect(() => {
    // Only initialize on client side (where localStorage is available)
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY;
    
    if (!publicKey) {
      console.warn('Memberstack public key not found. Please add NEXT_PUBLIC_MEMBERSTACK_PUBLIC_KEY to your .env.local file.');
      setLoading(false);
      return;
    }

    // Dynamically import Memberstack to avoid SSR issues
    import('@memberstack/dom')
      .then((memberstackModule) => {
        const memberstack = memberstackModule.default;
        
        // Initialize Memberstack
        const memberstackInstance = memberstack.init({ publicKey });
        setMs(memberstackInstance);

        // Check for existing session
        memberstackInstance.getCurrentMember()
          .then(({ data }: any) => {
            setMember(data);
          })
          .catch((error: any) => {
            console.error('Failed to get current member:', error);
          })
          .finally(() => {
            setLoading(false);
          });

        // Listen for auth changes
        const unsubscribe = memberstackInstance.onAuthChange((member: any) => {
          setMember(member?.data || null);
        });

        return () => {
          // Only call unsubscribe if it's actually a function
          if (typeof unsubscribe === 'function') {
            unsubscribe();
          }
        };
      })
      .catch((error) => {
        console.error('Failed to load Memberstack:', error);
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data } = await ms.loginMemberEmailPassword({ email, password });
      setMember(data);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data } = await ms.signupMemberEmailPassword({ email, password });
      setMember(data);
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await ms.logout();
      setMember(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  };

  return (
    <MemberstackContext.Provider value={{ member, loading, login, signup, logout, ms }}>
      {children}
    </MemberstackContext.Provider>
  );
}

export function useMemberstack() {
  const context = useContext(MemberstackContext);
  if (context === undefined) {
    throw new Error('useMemberstack must be used within a MemberstackProvider');
  }
  return context;
}


