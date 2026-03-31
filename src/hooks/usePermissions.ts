import { useEffect, useRef } from "react";
import { usePermissionStore, UserPermissions } from "../stores/permissionStore";
import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { permissionService } from "../services/permissionService";

/**
 * Role-based permission definitions
 * These match exactly with the backend permission middleware
 */
const ROLE_PERMISSIONS: Record<string, UserPermissions> = {
  CASHIER: {
    // Dashboard & Analytics
    canViewDashboard: true,
    canViewAnalytics: false,
    canViewFinancialReports: false,

    // User Management
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canManageUserRoles: false,

    // Inventory Management
    canViewProducts: true,
    canCreateProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canViewCategories: true,
    canCreateCategories: false,
    canEditCategories: false,
    canDeleteCategories: false,
    canViewSuppliers: false,
    canCreateSuppliers: false,
    canEditSuppliers: false,
    canDeleteSuppliers: false,

    // Sales Operations
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: false,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: false,
    canViewReturns: true,
    canCreateReturns: true,
    canEditReturns: false,
    canDeleteReturns: false,
    canViewPayments: true,
    canCreatePayments: true,
    canEditPayments: true,
    canDeletePayments: false,

    // Purchasing Operations
    canViewPurchases: false,
    canCreatePurchases: false,
    canEditPurchases: false,
    canDeletePurchases: false,
    canViewQuotes: true,
    canCreateQuotes: false,
    canEditQuotes: false,
    canDeleteQuotes: false,
    canViewStockMovements: false,
    canCreateStockMovements: false,

    // Human Resources
    canViewAbsences: false,
    canCreateAbsences: false,
    canEditAbsences: false,
    canDeleteAbsences: false,
    canApproveAbsences: false,
    canViewSalaries: false,
    canCreateSalaries: false,
    canEditSalaries: false,
    canDeleteSalaries: false,
    canApproveSalaries: false,
    canPaySalaries: false,
  },

  MANAGER: {
    // Dashboard & Analytics
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewFinancialReports: true,

    // User Management - MANAGER can view but NOT create/edit/delete
    canViewUsers: true,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canManageUserRoles: false,

    // Inventory Management - Full access
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewCategories: true,
    canCreateCategories: true,
    canEditCategories: true,
    canDeleteCategories: true,
    canViewSuppliers: true,
    canCreateSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: true,

    // Sales Operations - Full access
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewReturns: true,
    canCreateReturns: true,
    canEditReturns: true,
    canDeleteReturns: true,
    canViewPayments: true,
    canCreatePayments: true,
    canEditPayments: true,
    canDeletePayments: true,

    // Purchasing Operations - Full access
    canViewPurchases: true,
    canCreatePurchases: true,
    canEditPurchases: true,
    canDeletePurchases: true,
    canViewQuotes: true,
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewStockMovements: true,
    canCreateStockMovements: true,

    // Human Resources - Limited (can view/create/edit absences, but NOT delete/approve)
    canViewAbsences: true,
    canCreateAbsences: true,
    canEditAbsences: true,
    canDeleteAbsences: false,
    canApproveAbsences: false,
    canViewSalaries: false,
    canCreateSalaries: false,
    canEditSalaries: false,
    canDeleteSalaries: false,
    canApproveSalaries: false,
    canPaySalaries: false,
  },

  ADMIN: {
    // Dashboard & Analytics - Full access
    canViewDashboard: true,
    canViewAnalytics: true,
    canViewFinancialReports: true,

    // User Management - Full access
    canViewUsers: true,
    canCreateUsers: true,
    canEditUsers: true,
    canDeleteUsers: true,
    canManageUserRoles: true,

    // Inventory Management - Full access
    canViewProducts: true,
    canCreateProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canViewCategories: true,
    canCreateCategories: true,
    canEditCategories: true,
    canDeleteCategories: true,
    canViewSuppliers: true,
    canCreateSuppliers: true,
    canEditSuppliers: true,
    canDeleteSuppliers: true,

    // Sales Operations - Full access
    canViewSales: true,
    canCreateSales: true,
    canEditSales: true,
    canDeleteSales: true,
    canViewClients: true,
    canCreateClients: true,
    canEditClients: true,
    canDeleteClients: true,
    canViewReturns: true,
    canCreateReturns: true,
    canEditReturns: true,
    canDeleteReturns: true,
    canViewPayments: true,
    canCreatePayments: true,
    canEditPayments: true,
    canDeletePayments: true,

    // Purchasing Operations - Full access
    canViewPurchases: true,
    canCreatePurchases: true,
    canEditPurchases: true,
    canDeletePurchases: true,
    canViewQuotes: true,
    canCreateQuotes: true,
    canEditQuotes: true,
    canDeleteQuotes: true,
    canViewStockMovements: true,
    canCreateStockMovements: true,

    // Human Resources - Full access
    canViewAbsences: true,
    canCreateAbsences: true,
    canEditAbsences: true,
    canDeleteAbsences: true,
    canApproveAbsences: true,
    canViewSalaries: true,
    canCreateSalaries: true,
    canEditSalaries: true,
    canDeleteSalaries: true,
    canApproveSalaries: true,
    canPaySalaries: true,
  },
};

/**
 * Get permissions for a user role when permission service fails
 * Uses the same permission definitions as the backend
 */
const getPermissionsForRole = (role?: string): UserPermissions => {
  const normalizedRole = role?.toUpperCase() || "CASHIER";
  return ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.CASHIER;
};

/**
 * Hook to load and manage user permissions with performance optimizations
 */
export const usePermissions = () => {
  const { setPermissions, setLoading, setError, clearPermissions } =
    usePermissionStore();
  const { user, isAuthenticated } = useSessionAuthStore();
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const loadPermissions = async () => {
      const companyId = user?.company?.id || user?.companyId;

      if (!isAuthenticated || !companyId) {
        clearPermissions();
        hasLoadedRef.current = false;
        return;
      }

      // Get current state to avoid stale closures
      const currentState = usePermissionStore.getState();
      const {
        permissions: currentPermissions,
        lastFetched: currentLastFetched,
        isLoading,
      } = currentState;

      // Check if we have recent permissions (less than 5 minutes old)
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;

      if (
        currentPermissions &&
        currentLastFetched &&
        now - currentLastFetched < fiveMinutes
      ) {
        hasLoadedRef.current = true;
        return;
      }

      // If we've already loaded permissions in this session and they're not stale, skip
      if (hasLoadedRef.current && currentPermissions) {
        return;
      }

      // Check if we're already loading to prevent duplicate requests
      if (isLoading) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { permissions: freshPermissions, role } =
          await permissionService.loadUserPermissions(companyId);

        setPermissions(freshPermissions, role);
        hasLoadedRef.current = true;
      } catch {
        // If we have cached permissions, keep using them
        if (currentPermissions) {
          return;
        }

        // If permissions fail to load and we have no cache, provide role-based permissions
        const userRole = user?.role || user?.companyRole;
        const rolePermissions = getPermissionsForRole(userRole);

        setPermissions(rolePermissions, userRole || "CASHIER");
        hasLoadedRef.current = true;
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [
    isAuthenticated,
    user?.company?.id,
    user?.companyId,
    user?.role,
    user?.companyRole,
    setPermissions,
    setLoading,
    setError,
    clearPermissions,
  ]);

  return {
    isLoading: usePermissionStore((state) => state.isLoading),
    error: usePermissionStore((state) => state.error),
    permissions: usePermissionStore((state) => state.permissions),
    role: usePermissionStore((state) => state.role),
  };
};
