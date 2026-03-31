import { UserPermissions } from "../stores/permissionStore";
import { sessionAuthService } from "./sessionAuthService";
import { requestDeduplication } from "../utils/requestDeduplication";

export interface PermissionResponse {
  success: boolean;
  data: {
    role: string;
    permissions: UserPermissions;
  };
  message: string;
}

class PermissionService {
  private baseURL = import.meta.env.VITE_API_URL || "https://api.sellpoint.morita.vip";
  private requestCache = new Map<
    string,
    { data: PermissionResponse; timestamp: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch user permissions from backend with caching
   */
  async getUserPermissions(
    companyId: number,
    forceRefresh = false
  ): Promise<PermissionResponse> {
    const cacheKey = `permissions_${companyId}`;
    const now = Date.now();

    // Check cache first (unless force refresh)
    if (!forceRefresh && this.requestCache.has(cacheKey)) {
      const cached = this.requestCache.get(cacheKey)!;
      if (now - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `${this.baseURL}/auth/permissions?companyId=${companyId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionAuthService.getToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      // Handle nested response structure from backend
      const data: PermissionResponse = responseData.data || responseData;

      // Cache the response
      this.requestCache.set(cacheKey, { data, timestamp: now });

      return data;
    } catch (error) {
      // If we have cached data, return it even if it's stale
      if (this.requestCache.has(cacheKey)) {
        return this.requestCache.get(cacheKey)!.data;
      }

      throw error;
    }
  }

  /**
   * Load permissions and store them in the permission store with deduplication
   */
  async loadUserPermissions(companyId: number, forceRefresh = false) {
    const requestKey = `permissions_${companyId}_${forceRefresh}`;

    return requestDeduplication.execute(
      requestKey,
      async () => {
        const response = await this.getUserPermissions(companyId, forceRefresh);

        if (response.success) {
          const { permissions, role } = response.data;
          return { permissions, role };
        } else {
          throw new Error(response.message || "Failed to load permissions");
        }
      },
      30000 // 30 second TTL
    );
  }

  /**
   * Clear permission cache (useful when user permissions change)
   */
  clearCache(companyId?: number) {
    if (companyId) {
      this.requestCache.delete(`permissions_${companyId}`);
    } else {
      this.requestCache.clear();
    }
  }

  /**
   * Get cache statistics for debugging
   */
  getCacheStats() {
    return {
      size: this.requestCache.size,
      keys: Array.from(this.requestCache.keys()),
      entries: Array.from(this.requestCache.entries()).map(([key, value]) => ({
        key,
        age: Date.now() - value.timestamp,
        isStale: Date.now() - value.timestamp > this.CACHE_DURATION,
      })),
    };
  }
}

export const permissionService = new PermissionService();
