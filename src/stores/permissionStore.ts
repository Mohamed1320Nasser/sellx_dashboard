import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserPermissions {
  // Dashboard & Analytics
  canViewDashboard: boolean;
  canViewAnalytics: boolean;
  canViewFinancialReports: boolean;

  // User Management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canManageUserRoles: boolean;

  // Inventory Management
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canEditProducts: boolean;
  canDeleteProducts: boolean;
  canViewCategories: boolean;
  canCreateCategories: boolean;
  canEditCategories: boolean;
  canDeleteCategories: boolean;
  canViewSuppliers: boolean;
  canCreateSuppliers: boolean;
  canEditSuppliers: boolean;
  canDeleteSuppliers: boolean;

  // Sales Operations
  canViewSales: boolean;
  canCreateSales: boolean;
  canEditSales: boolean;
  canDeleteSales: boolean;
  canViewClients: boolean;
  canCreateClients: boolean;
  canEditClients: boolean;
  canDeleteClients: boolean;
  canViewReturns: boolean;
  canCreateReturns: boolean;
  canEditReturns: boolean;
  canDeleteReturns: boolean;
  canViewPayments: boolean;
  canCreatePayments: boolean;
  canEditPayments: boolean;
  canDeletePayments: boolean;

  // Purchasing Operations
  canViewPurchases: boolean;
  canCreatePurchases: boolean;
  canEditPurchases: boolean;
  canDeletePurchases: boolean;
  canViewQuotes: boolean;
  canCreateQuotes: boolean;
  canEditQuotes: boolean;
  canDeleteQuotes: boolean;
  canViewStockMovements: boolean;
  canCreateStockMovements: boolean;

  // Human Resources
  canViewAbsences: boolean;
  canCreateAbsences: boolean;
  canEditAbsences: boolean;
  canDeleteAbsences: boolean;
  canApproveAbsences: boolean;
  canViewSalaries: boolean;
  canCreateSalaries: boolean;
  canEditSalaries: boolean;
  canDeleteSalaries: boolean;
  canApproveSalaries: boolean;
  canPaySalaries: boolean;
}

interface PermissionState {
  permissions: UserPermissions | null;
  role: string | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setPermissions: (permissions: UserPermissions, role: string) => void;
  clearPermissions: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Permission checkers
  hasPermission: (permission: keyof UserPermissions) => boolean;
  hasAnyPermission: (permissions: (keyof UserPermissions)[]) => boolean;
  hasAllPermissions: (permissions: (keyof UserPermissions)[]) => boolean;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: null,
      role: null,
      isLoading: false,
      error: null,
      lastFetched: null,

      setPermissions: (permissions: UserPermissions, role: string) => {
        set({ permissions, role, error: null, lastFetched: Date.now() });
      },

      clearPermissions: () => {
        set({ permissions: null, role: null, error: null, lastFetched: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      hasPermission: (permission: keyof UserPermissions) => {
        const { permissions } = get();
        return permissions ? permissions[permission] : false;
      },

      hasAnyPermission: (permissions: (keyof UserPermissions)[]) => {
        const { permissions: userPermissions } = get();
        if (!userPermissions) return false;
        return permissions.some((permission) => userPermissions[permission]);
      },

      hasAllPermissions: (permissions: (keyof UserPermissions)[]) => {
        const { permissions: userPermissions } = get();
        if (!userPermissions) return false;
        return permissions.every((permission) => userPermissions[permission]);
      },
    }),
    {
      name: "permission-storage",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
    }
  )
);
