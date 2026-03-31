import { hasPermission, hasAnyRole, getRoleDisplayName } from "./authUtils";
import type { UserRole } from "../types/auth";

// Re-export auth utilities for backward compatibility
export { hasPermission, hasAnyRole, getRoleDisplayName };

// Additional permission utilities specific to this module
export const checkResourcePermission = (
  resource: string,
  action: string,
  userRole: UserRole | null
): boolean => {
  // This can be extended with more specific resource-based permissions
  // For now, we'll use role-based permissions
  return hasPermission(userRole as UserRole, userRole);
};

// Check if user can access admin features
export const canAccessAdminFeatures = (userRole: UserRole | null): boolean => {
  return hasPermission("ADMIN", userRole);
};

// Check if user can access system admin features
export const canAccessSystemAdminFeatures = (
  userRole: UserRole | null
): boolean => {
  return hasPermission("SYSTEM_ADMIN", userRole);
};

// Check if user can manage users
export const canManageUsers = (userRole: UserRole | null): boolean => {
  return hasPermission("ADMIN", userRole);
};

// Check if user can manage companies
export const canManageCompanies = (userRole: UserRole | null): boolean => {
  return hasPermission("SYSTEM_ADMIN", userRole);
};

// Check if user can manage products
export const canManageProducts = (userRole: UserRole | null): boolean => {
  return hasPermission("MANAGER", userRole);
};

// Check if user can process sales
export const canProcessSales = (userRole: UserRole | null): boolean => {
  return hasPermission("CASHIER", userRole);
};
