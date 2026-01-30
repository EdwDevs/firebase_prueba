'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const routePermissions: Record<string, UserRole[]> = {
  '/pos': ['admin', 'cashier', 'waiter'],
  '/pos/tables': ['admin', 'cashier', 'waiter'],
  '/pos/takeout': ['admin', 'cashier', 'waiter'],
  '/pos/delivery': ['admin', 'cashier', 'waiter'],
  '/bar': ['admin', 'cashier', 'waiter'],
  '/cash': ['admin', 'cashier'],
  '/reports': ['admin'],
  '/admin': ['admin'],
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, hasRole } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      // Determinar roles permitidos para esta ruta
      const requiredRoles = allowedRoles || getRequiredRoles(pathname);
      
      if (requiredRoles && !hasRole(requiredRoles)) {
        router.push('/pos/tables');
      }
    }
  }, [isAuthenticated, isLoading, router, pathname, user, hasRole, allowedRoles]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function getRequiredRoles(pathname: string): UserRole[] | null {
  for (const [route, roles] of Object.entries(routePermissions)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}
