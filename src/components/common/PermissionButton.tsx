import React from 'react';
import { PermissionGuard } from './PermissionGuard';
import { UserPermissions } from '../../stores/permissionStore';

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  permission?: keyof UserPermissions;
  permissions?: (keyof UserPermissions)[];
  requireAll?: boolean;
  disabledFallback?: React.ReactNode;
  hideWhenDisabled?: boolean;
}

/**
 * PermissionButton component that renders a button with permission-based access control
 * 
 * @param children - Button content
 * @param permission - Single permission to check
 * @param permissions - Multiple permissions to check
 * @param requireAll - If true, requires ALL permissions. If false, requires ANY permission
 * @param disabledFallback - Content to show when permission is denied (when hideWhenDisabled=false)
 * @param hideWhenDisabled - If true, hides the button. If false, shows disabledFallback
 */
export const PermissionButton: React.FC<PermissionButtonProps> = ({
  children,
  permission,
  permissions,
  requireAll = false,
  disabledFallback,
  hideWhenDisabled = true,
  disabled,
  ...buttonProps
}) => {
  return (
    <PermissionGuard
      permission={permission}
      permissions={permissions}
      requireAll={requireAll}
      hide={hideWhenDisabled}
      fallback={disabledFallback}
    >
      <button
        {...buttonProps}
        disabled={disabled}
      >
        {children}
      </button>
    </PermissionGuard>
  );
};

export default PermissionButton;
