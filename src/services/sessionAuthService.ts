// Session-based Authentication Service (inspired by eduloom flow)
// Supports both sessionStorage (default) and localStorage (remember me)

import { getApiConfig } from "@/shared/api/config";

interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    user: any;
  };
  msg?: string;
}

class SessionAuthService {
  // Get baseURL dynamically from config (supports Electron stored config)
  private getBaseURL(): string {
    const config = getApiConfig();
    return config.baseURL || import.meta.env.VITE_API_BASE_URL || "https://api.sellpoint.morita.vip";
  }

  // Get the appropriate storage based on remember me setting
  private getStorage(): Storage {
    // Check if rememberMe was set in localStorage
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    return rememberMe ? localStorage : sessionStorage;
  }

  // Check if user is authorized (like eduloom's checkIfAuthorized)
  checkIfAuthorized(): boolean {
    // Check both storages - localStorage first (remember me), then sessionStorage
    const localToken = localStorage.getItem("token");
    const sessionToken = sessionStorage.getItem("token");
    const token = localToken || sessionToken;

    const localAuthed = localStorage.getItem("isAuthed");
    const sessionAuthed = sessionStorage.getItem("isAuthed");
    const isAuthed = localAuthed || sessionAuthed;

    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");
    const user = localUser || sessionUser;

    // Basic validation - token, auth flag, and user data must exist
    const isAuthorized = !!(token && isAuthed && user);

    return isAuthorized;
  }

  // Get current token
  getToken(): string | null {
    // Check localStorage first (remember me), then sessionStorage
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  // Get current user
  getCurrentUser(): any {
    const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }

  // Get current company
  getCompany(): any {
    const companyStr = localStorage.getItem("company") || sessionStorage.getItem("company");
    return companyStr ? JSON.parse(companyStr) : null;
  }

  // Login method (like eduloom's submitLogin)
  async submitLogin(
    emailOrUsername: string,
    password: string,
    rememberMe: boolean = false
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.getBaseURL()}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrUsername: emailOrUsername,
          password,
          identifier: navigator.userAgent,
          source: "web",
          rememberMe: rememberMe,
        }),
      });

      const responseData = await response.json();

      // API response structure: { data: { login: true, token: "...", user: {...}, rememberMe: true/false } }
      if (response.ok && responseData.data && responseData.data.login === true) {
        const { token, user, rememberMe: remember } = responseData.data;

        // Choose storage based on rememberMe option from server
        const storage = remember ? localStorage : sessionStorage;

        // Store rememberMe preference in localStorage (always)
        localStorage.setItem("rememberMe", remember ? "true" : "false");

        // Clear the other storage to avoid conflicts
        if (remember) {
          sessionStorage.removeItem("token");
          sessionStorage.removeItem("isAuthed");
          sessionStorage.removeItem("user");
          sessionStorage.removeItem("company");
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("isAuthed");
          localStorage.removeItem("user");
          localStorage.removeItem("company");
        }

        // Store authentication data in chosen storage
        storage.setItem("token", token);
        storage.setItem("isAuthed", "true");
        storage.setItem("user", JSON.stringify(user));

        // Store company data separately for easy access
        if (user.company) {
          storage.setItem("company", JSON.stringify(user.company));
        }

        return {
          success: true,
          data: {
            token,
            user,
          },
        };
      } else {
        return {
          success: false,
          msg: responseData.msg || "Login failed",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        msg: error.message || "Network error occurred",
      };
    }
  }

  // Logout method (like eduloom's logout)
  logout(): void {
    // Clear both storages
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("isAuthed");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("company");
    sessionStorage.removeItem("permission-storage");

    localStorage.removeItem("token");
    localStorage.removeItem("isAuthed");
    localStorage.removeItem("user");
    localStorage.removeItem("company");
    localStorage.removeItem("rememberMe");
  }

  // Clear all session data (like eduloom's sessionStorage.clear)
  clearSession(): void {
    sessionStorage.clear();
  }

  // Make authenticated API request (like eduloom's axios with token)
  async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    const token = this.getToken();

    if (!token) {
      throw new Error("No authentication token found");
    }

    const defaultHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const response = await fetch(`${this.getBaseURL()}${url}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    // Handle 403 Forbidden (like eduloom's ForberidenAlert)
    if (response.status === 403) {
      this.handleSessionExpired();
      throw new Error("Session expired");
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Handle session expired (like eduloom's ForberidenAlert)
  private handleSessionExpired(): void {
    // Show session expired alert
    alert("Your session has expired. Please login again.");

    // Clear session and redirect to login
    this.clearSession();
    window.location.href = "/login";
  }

  // Check if session is valid
  isSessionValid(): boolean {
    return this.checkIfAuthorized();
  }
}

// Export singleton instance
export const sessionAuthService = new SessionAuthService();
export default sessionAuthService;
