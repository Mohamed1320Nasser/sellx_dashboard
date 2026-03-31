import { useSessionAuthStore } from "../stores/sessionAuthStore";
import {
  isTokenExpired,
  isValidTokenFormat,
  getTokenPayload,
} from "./tokenUtils";
import type { UserRole } from "../types/auth";

/**
 * Authentication utility functions
 */

// Role hierarchy for permission checking
export const ROLE_HIERARCHY = {
  CASHIER: 1,
  MANAGER: 2,
  ADMIN: 3,
  SYSTEM_ADMIN: 4,
} as const;

/**
 * Check if user has permission based on role hierarchy
 */
export const hasPermission = (
  requiredRole: UserRole,
  userRole: UserRole | null
): boolean => {
  if (!userRole) return false;

  const userRoleLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || 0;

  return userRoleLevel >= requiredRoleLevel;
};

/**
 * Check if user has any of the required roles
 */
export const hasAnyRole = (
  requiredRoles: UserRole[],
  userRole: UserRole | null
): boolean => {
  if (!userRole) return false;
  return requiredRoles.includes(userRole);
};

/**
 * Get role display name in Arabic
 */
export const getRoleDisplayName = (role: UserRole | null): string => {
  const roleNames: Record<UserRole, string> = {
    CASHIER: "كاشير",
    MANAGER: "مدير",
    ADMIN: "مدير شركة",
    SYSTEM_ADMIN: "مدير النظام",
  };
  return role ? roleNames[role] : "غير محدد";
};

/**
 * Check if user is authenticated and token is valid
 */
export const isAuthenticated = (): boolean => {
  const authStore = useSessionAuthStore.getState();
  const token =
    authStore.token ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token || !authStore.isAuthenticated) {
    return false;
  }

  return isValidTokenFormat(token) && !isTokenExpired(token);
};

/**
 * Get current user from store
 */
export const getCurrentUser = () => {
  const authStore = useSessionAuthStore.getState();
  return authStore.user;
};

/**
 * Get current user role
 */
export const getCurrentUserRole = (): UserRole | null => {
  const authStore = useSessionAuthStore.getState();
  return authStore.user?.role;
};

/**
 * Get current company
 */
export const getCurrentCompany = () => {
  const authStore = useSessionAuthStore.getState();
  return authStore.company;
};

/**
 * Check if current user has specific role
 */
export const currentUserHasRole = (requiredRole: UserRole): boolean => {
  const userRole = getCurrentUserRole();
  return hasPermission(requiredRole, userRole);
};

/**
 * Check if current user is admin
 */
export const isCurrentUserAdmin = (): boolean => {
  return currentUserHasRole("ADMIN") || currentUserHasRole("SYSTEM_ADMIN");
};

/**
 * Check if current user is system admin
 */
export const isCurrentUserSystemAdmin = (): boolean => {
  return currentUserHasRole("SYSTEM_ADMIN");
};

/**
 * Check if current user is manager or above
 */
export const isCurrentUserManagerOrAbove = (): boolean => {
  return currentUserHasRole("MANAGER");
};

/**
 * Get user display name
 */
export const getUserDisplayName = (): string => {
  const user = getCurrentUser();
  return user?.fullname || "مستخدم غير معروف";
};

/**
 * Get company name
 */
export const getCompanyName = (): string => {
  const company = getCurrentCompany();
  return company?.name || company?.company?.name || "غير محدد";
};

/**
 * Check if user belongs to a company
 */
export const hasCompany = (): boolean => {
  const company = getCurrentCompany();
  return !!company;
};

/**
 * Get valid token for API requests
 */
export const getValidToken = (): string | null => {
  const authStore = useSessionAuthStore.getState();
  const token =
    authStore.token ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (!token || !isValidTokenFormat(token) || isTokenExpired(token)) {
    return null;
  }

  return token;
};

/**
 * Check if token needs refresh (using tokenUtils)
 */
export const shouldRefreshToken = (): boolean => {
  const token = getValidToken();
  if (!token) return false;

  try {
    const payload = getTokenPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const currentTime = Date.now() / 1000;
    const tenMinutes = 10 * 60; // 10 minutes in seconds
    return payload.exp - currentTime < tenMinutes;
  } catch {
    return true;
  }
};

/**
 * Clear all authentication data
 */
export const clearAuthData = (): void => {
  const authStore = useSessionAuthStore.getState();
  authStore.logout();
};

/**
 * Logout user
 */
export const logoutUser = (): void => {
  const authStore = useSessionAuthStore.getState();
  authStore.logout();
};

/**
 * Initialize authentication
 */
export const initializeAuth = async (): Promise<void> => {
  const authStore = useSessionAuthStore.getState();
  await authStore.initialize();
};

/**
 * Check if user can access a specific route
 */
export const canAccessRoute = (requiredRole?: UserRole): boolean => {
  if (!isAuthenticated()) {
    return false;
  }

  if (!requiredRole) {
    return true;
  }

  return currentUserHasRole(requiredRole);
};

/**
 * Get user permissions for a specific resource
 */
export const getResourcePermissions = (_resource: string) => {
  // Session auth store doesn't have permissions, return empty array
  return [];
};

/**
 * Check if user can perform action on resource
 */
export const canPerformAction = (
  _resource: string,
  _action: string
): boolean => {
  // Session auth store doesn't have checkPermission, return true for now
  return true;
};
