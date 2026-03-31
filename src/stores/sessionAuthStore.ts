import { create } from "zustand";
import { sessionAuthService } from "../services/sessionAuthService";
import { usePermissionStore } from "./permissionStore";

// Helper function to map user role to company role
// Now we use the companyRole directly from the backend instead of mapping
const mapUserRoleToCompanyRole = (
  userRole: string,
  companyRole?: string
): string => {
  // If companyRole is provided, use it directly
  if (companyRole) {
    return companyRole;
  }

  // Fallback to mapping global user role (for backward compatibility)
  switch (userRole.toLowerCase()) {
    case "admin":
    case "system":
      return "ADMIN";
    case "user":
      return "MANAGER"; // Default to MANAGER for regular users
    case "tester":
      return "CASHIER"; // Testers get CASHIER role
    default:
      return "CASHIER"; // Default fallback
  }
};

// Session-based Auth Store (inspired by eduloom flow)
interface SessionAuthStore {
  // State
  user: any | null;
  company: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  login: (credentials: {
    emailOrUsername: string;
    password: string;
    isAdmin?: boolean;
    rememberMe?: boolean;
  }) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
  initialize: () => boolean;
  getCurrentUser: () => any;
  getToken: () => string | null;
}

export const useSessionAuthStore = create<SessionAuthStore>((set, get) => ({
  // Initial State
  user: null,
  company: null,
  isAuthenticated: false,
  isLoading: false,
  token: null,

  // Login Action (like eduloom's handleLogin)
  login: async (credentials: {
    emailOrUsername: string;
    password: string;
    isAdmin?: boolean;
    rememberMe?: boolean;
  }) => {
    set({ isLoading: true });

    try {
      const response = await sessionAuthService.submitLogin(
        credentials.emailOrUsername,
        credentials.password,
        credentials.rememberMe || false
      );

      if (response.success && response.data) {
        const { token, user } = response.data;

        // Map user role to company role for navigation
        const mappedUser = {
          ...user,
          role: mapUserRoleToCompanyRole(user.role, user.companyRole),
        };

        // Create company object with backward compatibility (companyId and company.name)
        const companyData = user.company
          ? {
              ...user.company,
              companyId: user.company.id, // For backward compatibility
              company: user.company, // For backward compatibility (company?.company?.name)
            }
          : null;

        set({
          user: mappedUser,
          company: companyData,
          isAuthenticated: true,
          token,
          isLoading: false,
        });

        return true;
      } else {
        set({ isLoading: false });
        return false;
      }
    } catch {
      set({ isLoading: false });
      return false;
    }
  },

  // Logout Action (like eduloom's handleLogout)
  logout: () => {
    sessionAuthService.logout();
    // Clear permissions when logging out
    usePermissionStore.getState().clearPermissions();
    set({
      user: null,
      company: null,
      isAuthenticated: false,
      token: null,
    });
  },

  // Check Authentication (like eduloom's checkIfAuthorized)
  checkAuth: () => {
    const isAuth = sessionAuthService.checkIfAuthorized();

    if (isAuth) {
      const user = sessionAuthService.getCurrentUser();
      const token = sessionAuthService.getToken();

      // Validate that we have all required data
      if (!user || !token) {
        set({
          user: null,
          company: null,
          isAuthenticated: false,
          token: null,
        });
        return false;
      }

      // Map user role to company role for navigation
      const mappedUser = {
        ...user,
        role: mapUserRoleToCompanyRole(user.role, user.companyRole),
      };

      // Get company from sessionStorage (saved during login)
      const rawCompany = sessionAuthService.getCompany() || user?.company;

      // Create company object with backward compatibility
      const companyData = rawCompany
        ? {
            ...rawCompany,
            companyId: rawCompany.id, // For backward compatibility
            company: rawCompany, // For backward compatibility (company?.company?.name)
          }
        : null;

      set({
        user: mappedUser,
        company: companyData,
        isAuthenticated: true,
        token,
      });
    } else {
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        token: null,
      });
    }

    return isAuth;
  },

  // Initialize (check existing session)
  initialize: () => {
    set({ isLoading: true });

    // Use improved local validation
    const isAuth = get().checkAuth();

    if (!isAuth) {
      set({
        user: null,
        company: null,
        isAuthenticated: false,
        token: null,
        isLoading: false,
      });
    }

    set({ isLoading: false });
    return isAuth;
  },

  // Get Current User
  getCurrentUser: () => {
    return get().user;
  },

  // Get Token
  getToken: () => {
    return sessionAuthService.getToken();
  },
}));
