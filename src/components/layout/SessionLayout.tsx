import React, { useEffect } from 'react';
import { useSessionAuthStore } from '../../stores/sessionAuthStore';
import SessionNavbar from './SessionNavbar';
import SessionRouteGuard from '../auth/SessionRouteGuard';

interface SessionLayoutProps {
  children: React.ReactNode;
}

// Session-based Layout (inspired by eduloom's layout structure)
const SessionLayout: React.FC<SessionLayoutProps> = ({ children }) => {
  const { initialize } = useSessionAuthStore();

  useEffect(() => {
    // Initialize session auth on app load
    initialize();
  }, [initialize]);

  return (
    <SessionRouteGuard>
      <div className="w-full min-h-screen bg-gray-50">
        <SessionNavbar />
        <main className="w-full py-0 px-0">
          {children}
        </main>
      </div>
    </SessionRouteGuard>
  );
};

export default SessionLayout;
