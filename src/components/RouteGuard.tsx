import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSessionAuthStore } from '../stores/sessionAuthStore';
import { LoadingSpinner } from './ui';
import { hasPermission } from '../utils/permissions';
import type { UserRole } from '../types/auth';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  publicPaths?: string[];
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole,
  publicPaths = ['/login', '/company/register']
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const { isAuthenticated, user, isLoading, initialize } = useSessionAuthStore();
  const role = user?.role;

  const authCheck = useCallback(async (pathname: string) => {
    // Initialize auth state if not already done
    if (!isAuthenticated && !isLoading) {
      await initialize();
    }

    const path = pathname.split('?')[0];
    const isPublicPath = publicPaths.includes(path);

    // If it's a public path, allow access
    if (isPublicPath) {
      setAuthorized(true);
      return;
    }

    // If not authenticated and not a public path, redirect to login
    if (!isAuthenticated || !user) {
      setAuthorized(false);
      navigate('/login', { replace: true });
      return;
    }

    // Check role permissions if required
    if (requiredRole && !hasPermission(requiredRole, role)) {
      setAuthorized(false);
      // Show unauthorized message or redirect
      navigate('/', { replace: true });
      return;
    }

    setAuthorized(true);
  }, [isAuthenticated, isLoading, initialize, publicPaths, user, requiredRole, role, navigate]);

  useEffect(() => {
    authCheck(location.pathname);
  }, [location.pathname, authCheck]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="جاري التحقق من الصلاحيات..." />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
};

export default RouteGuard;
