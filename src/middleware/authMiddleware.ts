import { useSessionAuthStore } from "../stores/sessionAuthStore";
import { showErrorToast } from "../utils/errorHandler";

/**
 * Simple authentication middleware (like eduloom pattern)
 * Handles basic token validation and error handling
 */
export class AuthMiddleware {
  private static instance: AuthMiddleware;

  static getInstance(): AuthMiddleware {
    if (!AuthMiddleware.instance) {
      AuthMiddleware.instance = new AuthMiddleware();
    }
    return AuthMiddleware.instance;
  }

  /**
   * Check if user is authenticated (simple like eduloom)
   */
  isAuthenticated(): boolean {
    const authStore = useSessionAuthStore.getState();
    const token =
      authStore.token ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");
    const isAuthed =
      localStorage.getItem("isAuthed") || sessionStorage.getItem("isAuthed");

    return !!(token && isAuthed && authStore.isAuthenticated);
  }

  /**
   * Get token for API requests
   */
  getValidToken(): string | null {
    const authStore = useSessionAuthStore.getState();
    const token =
      authStore.token ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token");

    if (!token) {
      return null;
    }

    return token;
  }

  /**
   * Handle authentication errors (like eduloom's ForberidenAlert)
   */
  handleAuthError(error: any): void {
    const authStore = useSessionAuthStore.getState();

    if (error?.response?.status === 401 || error?.response?.status === 403) {
      // Unauthorized/Forbidden - session expired like eduloom
      authStore.logout();
      showErrorToast("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");

      // Trigger auth error event for TokenExpirationWarning
      window.dispatchEvent(new CustomEvent("auth-error"));
    }
  }

  /**
   * Initialize authentication state
   */
  async initialize(): Promise<void> {
    const authStore = useSessionAuthStore.getState();
    await authStore.initialize();
  }

  /**
   * Clear all authentication data
   */
  clearAuth(): void {
    const authStore = useSessionAuthStore.getState();
    authStore.logout();
  }
}

// Export singleton instance
export const authMiddleware = AuthMiddleware.getInstance();
