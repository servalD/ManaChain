/**
 * Custom hook to check authentication status
 * Verifies token validity and redirects if expired or missing
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthService from '@/services/auth.service';
import { IUser } from '@/types/user.types';

export function useAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is logged in
        const loggedIn = await AuthService.isLogged();
        
        if (!loggedIn) {
          // No token or invalid token
          router.push(redirectTo);
          return;
        }

        // Get user data
        const userData = await AuthService.getUser();
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          // Token exists but couldn't get user data
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
    await AuthService.logout();
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.getUser();
      if (userData) {
        setUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
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
