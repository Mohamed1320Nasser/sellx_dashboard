import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';

interface SessionRouteGuardProps {
  children: React.ReactNode;
}

// Session-based Route Guard (inspired by eduloom's RouteGuard)
const SessionRouteGuard: React.FC<SessionRouteGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState(false);
  const { checkAuth } = useSessionAuthStore();

  const authCheck = useCallback((url: string) => {
    const isAuthorized = checkAuth();
    const publicPaths = ['/login', '/company/register', '/session-demo'];
    const path = url.split('?')[0];

    if (!isAuthorized && !publicPaths.includes(path)) {
      setAuthorized(false);
      navigate('/login', { replace: true });
    } else {
      setAuthorized(true);
    }
  }, [checkAuth, navigate]);

  useEffect(() => {
    authCheck(location.pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      authCheck(location.pathname);
    };

    // Check auth on route changes
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [location.pathname, checkAuth, navigate, authCheck]);

  return authorized ? <>{children}</> : null;
};

export default SessionRouteGuard;
