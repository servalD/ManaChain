/**
 * Custom hook to check authentication status
 * Verifies token validity and redirects if expired or missing
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkSession, logout as logoutSession } from '@/hooks/api/useAuth';
import type { UserResponse } from '@/api/generated/models';

export function useAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await checkSession();

        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          router.push(redirectTo);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push(redirectTo);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

  const logout = async () => {
    logoutSession();
    router.push('/login');
  };

  const refreshUser = async (): Promise<UserResponse | null> => {
    try {
      const userData = await checkSession();
      if (userData) {
        setUser(userData);
      }
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    refreshUser,
  };
}
