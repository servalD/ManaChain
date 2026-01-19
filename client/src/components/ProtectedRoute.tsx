/**
 * Protected Route Component
 * Wraps pages that require authentication
 */

"use client";

import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login',
  loadingComponent 
}: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuth(redirectTo);

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen bg-linear-to-br from-black via-gray-950 to-black flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useAuth hook
  }

  return <>{children}</>;
}
