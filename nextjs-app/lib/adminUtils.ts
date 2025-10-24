/**
 * Admin utility functions
 */

export interface User {
  id: number;
  email: string;
  name?: string;
  plan_id?: number;
}

/**
 * Check if a user is an admin
 * Admins have unlimited access and can use test mode
 */
export function isAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  
  // Check if user is admin by email or ID
  return user.email === 'aarontownsend6@gmail.com' || user.id === 1;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if current user is admin
 */
export function isCurrentUserAdmin(): boolean {
  return isAdmin(getCurrentUser());
}







