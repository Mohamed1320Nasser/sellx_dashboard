import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/ui";

// Auth Context Type
interface AuthContextType {
  // State
  user: any;
  company: any;
  role: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  login: (credentials: { email: string; password: string; isAdmin?: boolean }) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;

  // Utilities
  hasAnyRole: (roles: string[]) => boolean;
  hasRole: (requiredRole: string | string[]) => boolean;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  // Auto-refresh user data periodically
  useEffect(() => {
    if (auth.isAuthenticated) {
      const interval = setInterval(() => {
        // Re-initialize to refresh user data
        auth.initialize();
      }, 5 * 60 * 1000); // Refresh every 5 minutes

      return () => clearInterval(interval);
    }
  }, [auth.isAuthenticated, auth.initialize]);

  // Show loading spinner while initializing
  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="جاري تحميل النظام..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// Higher-order component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string | string[]
) => {
  return (props: P) => {
    const { isAuthenticated, hasRole, isLoading } = useAuthContext();

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <LoadingSpinner size="lg" text="جاري التحقق من الصلاحيات..." />
        </div>
      );
    }

    if (!isAuthenticated) {
      window.location.href = "/login";
      return null;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">غير مصرح</h2>
            <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

export default AuthContext;