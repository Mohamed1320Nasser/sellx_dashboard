import React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';
import { UserPermissions } from '../../stores/permissionStore';

interface PermissionLinkProps extends Omit<LinkProps, 'to'> {
  to: string;
  children: React.ReactNode;
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean;
  disabledFallback?: React.ReactNode;
  hideWhenDisabled?: boolean;
}

/**
 * PermissionLink component that renders a Link with permission-based access control
 * 
 * @param to - Link destination
 * @param children - Link content
 * @param permission - Single permission to check
 * @param permissions - Multiple permissions to check
 * @param requireAll - If true, requires ALL permissions. If false, requires ANY permission
 * @param disabledFallback - Content to show when permission is denied (when hideWhenDisabled=false)
 * @param hideWhenDisabled - If true, hides the link. If false, shows disabledFallback
 */
export const PermissionLink: React.FC<PermissionLinkProps> = ({
  to,
  children,
  permission,
  permissions,
  requireAll = false,
  disabledFallback,
  hideWhenDisabled = true,
  ...linkProps
}) => {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      hide={hideWhenDisabled}
      fallback={disabledFallback}
    >
      <Link to={to} {...linkProps}>
        {children}
      </Link>
    </PermissionGuard>
  );
};

export default PermissionLink;
