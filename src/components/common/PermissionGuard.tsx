import React from 'react';
import { usePermissionStore, UserPermissions } from '../../stores/permissionStore';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean; // If true, requires ALL permissions. If false, requires ANY permission
  fallback?: React.ReactNode;
  hide?: boolean; // If true, hides the element. If false, shows fallback
}

/**
 * PermissionGuard component that conditionally renders children based on user permissions
 * 
 * @param children - Content to render if permission is granted
 * @param permission - Single permission to check
 * @param permissions - Multiple permissions to check
 * @param requireAll - If true, requires ALL permissions. If false, requires ANY permission
 * @param fallback - Content to render if permission is denied (when hide=false)
 * @param hide - If true, hides the element completely. If false, shows fallback
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  hide = true,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, permissions: userPermissions } = usePermissionStore();

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions && permissions.length > 0) {
    if (requireAll) {
      hasAccess = hasAllPermissions(permissions);
    } else {
      hasAccess = hasAnyPermission(permissions);
    }
  } else {
    // If no permission specified, allow access
    hasAccess = true;
  }

  if (!hasAccess) {
    return hide ? null : <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
