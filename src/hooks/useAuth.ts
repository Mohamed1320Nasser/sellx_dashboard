import { useCallback, useEffect } from "react";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { useApiErrorHandler } from "./useApiErrorHandler";
import toast from "react-hot-toast";

// Simplified authentication hook for session-based auth
export const useAuth = () => {
  const {
    user,
    company,
    isAuthenticated,
    isLoading,
    token,
    login,
    logout,
    initialize,
  } = useSessionAuthStore();

  // Get role from user object
  const role = user?.role;

  const { handleError } = useApiErrorHandler();

  // Initialize auth on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Enhanced login with better error handling
  const handleLogin = useCallback(
    async (credentials: {
      email: string;
      password: string;
      isAdmin?: boolean;
    }) => {
      try {
        const success = await login({
          emailOrUsername: credentials.email,
          password: credentials.password,
          isAdmin: credentials.isAdmin,
        });
        if (success) {
          toast.success("تم تسجيل الدخول بنجاح");
          return true;
        } else {
          toast.error("فشل في تسجيل الدخول");
          return false;
        }
      } catch (error) {
        handleError(error, "فشل في تسجيل الدخول");
        return false;
      }
    },
    [login, handleError]
  );

  // Enhanced logout with cleanup
  const handleLogout = useCallback(() => {
    try {
      logout();
      toast.success("تم تسجيل الخروج بنجاح");
    } catch (error) {
      handleError(error, "حدث خطأ أثناء تسجيل الخروج");
    }
  }, [logout, handleError]);

  // Check if user has any of the specified roles
  const hasAnyRole = useCallback(
    (roles: string[]) => {
      return roles.includes(role || "");
    },
    [role]
  );

  // Check if user has specific role
  const hasRole = useCallback(
    (requiredRole: string | string[]) => {
      if (!role) return false;
      if (Array.isArray(requiredRole)) {
        return requiredRole.includes(role);
      }
      return role === requiredRole;
    },
    [role]
  );

  return {
    // State
    user,
    company,
    role,
    isAuthenticated,
    isLoading,
    token,

    // Actions
    login: handleLogin,
    logout: handleLogout,
    initialize,
    hasAnyRole,
    hasRole,
  };
};
