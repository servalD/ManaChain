/**
 * Role Protected Route Component
 * Wraps pages that require a specific user role
 */

"use client";

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface RoleProtectedRouteProps {
  children: ReactNode;
  allowedRoles: ('CLIENT' | 'BRANDUSER' | 'ADMIN')[];
  loadingComponent?: ReactNode;
}

export function RoleProtectedRoute({ 
  children, 
  allowedRoles,
  loadingComponent 
}: RoleProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth('/login');
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = user.role;
      
      // If user has no role or role is not in allowed roles, redirect
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect based on role
        if (userRole === 'CLIENT') {
          router.push('/discover');
        } else if (userRole === 'BRANDUSER') {
          router.push('/brand/dashboard');
        } else if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else {
          // Default redirect to discover
          router.push('/discover');
        }
      }
    }
  }, [user, isLoading, isAuthenticated, allowedRoles, router]);

  if (isLoading) {
    return (
      loadingComponent || (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useAuth hook
  }

  // Check if user role is allowed
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
